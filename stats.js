// background processing with a Web Worker
// Loaded on training.html. It builds a large list of records, sends it
// to worker.js, and shows the statistics the worker sends back. A page
// counter keeps running the whole time to show the page is not frozen.

(function () {

    const DEPARTMENTS = ["Engineering", "Human Resources", "Finance", "Operations"];

    const runButton = document.getElementById("run-stats-button");
    const cancelButton = document.getElementById("cancel-stats-button");
    const sizeSelect = document.getElementById("record-count");
    const counterElement = document.getElementById("page-counter");
    const statusElement = document.getElementById("stats-status");
    const resultsElement = document.getElementById("stats-results");

    // Stop quietly if this page does not have the section.
    if (!runButton || !cancelButton || !counterElement || !statusElement || !resultsElement) {
        return;
    }

    // The current worker (null when nothing is running).
    let worker = null;

    // a page counter that keeps running. If the page froze,
    // the number would stop going up.
    let counter = 0;
    setInterval(function () {
        counter++;
        counterElement.textContent = counter;
    }, 100);

    // Helpers
    function showStatus(text, isError) {
        statusElement.textContent = text;
        statusElement.className = isError ? "feedback feedback-error" : "feedback";
    }

    function setRunning(isRunning) {
        runButton.disabled = isRunning;
        cancelButton.disabled = !isRunning;
        sizeSelect.disabled = isRunning;
        document.body.classList.toggle("is-processing", isRunning);
    }

    // make a list of fictitious records.
    function generateRecords(count) {
        const records = [];
        for (let i = 1; i <= count; i++) {
            records.push({
                id: i,
                name: "Employee " + i,
                department: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
                trainingHours: Math.floor(Math.random() * 41) // 0 to 40
            });
        }
        return records;
    }

    // Stops the worker and frees it.
    function stopWorker() {
        if (worker) {
            worker.terminate();
            worker = null;
        }
    }

    // show the results from the worker on the page.
    function showResults(result) {
        resultsElement.innerHTML = "";

        const summary = document.createElement("p");
        summary.textContent =
            result.total.toLocaleString() + " records processed in " + result.milliseconds + " ms. " +
            "Average training hours: " + result.averageHours.toFixed(2) + ". " +
            "Highest training hours: " + result.highestHours + " (" + result.highestName + ").";
        resultsElement.appendChild(summary);

        const table = document.createElement("table");
        table.className = "stats-table";
        const head = document.createElement("tr");
        ["Department", "Employees", "Average training hours"].forEach(function (title) {
            const th = document.createElement("th");
            th.textContent = title;
            head.appendChild(th);
        });
        table.appendChild(head);

        for (const department in result.countByDepartment) {
            const row = document.createElement("tr");
            [
                department,
                result.countByDepartment[department].toLocaleString(),
                result.averageByDepartment[department].toFixed(2)
            ].forEach(function (value) {
                const td = document.createElement("td");
                td.textContent = value;
                row.appendChild(td);
            });
            table.appendChild(row);
        }
        resultsElement.appendChild(table);
    }

    // Start: create the worker, send the data, wait for the answer
    runButton.addEventListener("click", function () {
        const count = Number(sizeSelect.value);

        resultsElement.innerHTML = "";
        showStatus("Creating " + count.toLocaleString() + " records...", false);
        setRunning(true);

        // Let the browser show the message before the records are built.
        setTimeout(function () {
            const records = generateRecords(count);

            // create the worker from its own file.
            worker = new Worker("worker.js");

            // onmessage runs when the worker sends its result.
            worker.onmessage = function (event) {
                showResults(event.data);
                showStatus("Done. The worker finished the calculation.", false);
                stopWorker();          // 14.8: finished, so stop the worker
                setRunning(false);
            };

            // onerror runs if the worker has a problem.
            worker.onerror = function (error) {
                console.log("Worker error:", error);
                showStatus("The background calculation failed: " + (error.message || "unknown error"), true);
                stopWorker();
                setRunning(false);
            };

            // send the records to the worker.
            showStatus("The worker is calculating in the background. The counter keeps running...", false);
            worker.postMessage({ records: records });
        }, 50);
    });

    // the Cancel button stops the worker straight away.
    cancelButton.addEventListener("click", function () {
        stopWorker();
        showStatus("Cancelled. The worker was stopped.", false);
        setRunning(false);
    });

})();
// ==========================================================
// remote.js - Task 11: communicate with a remote data source
//
// Loaded on employees.html (after jQuery). It talks to the supplied
// server.js:
//   GET /employees.json   the employee "database"
//   GET /api/fail         always replies 500 (to test error handling)
//
// The same request is written four ways so that every technique is
// used: XMLHttpRequest + Promise, fetch, async/await, and jQuery.
//
// Everything is inside a function so nothing clashes with the variable
// names used in your other scripts.
// ==========================================================
import $ from "jquery";

export function initRemote() {

    const EMPLOYEES_URL = "/employees.json";
    const FAIL_URL = "/api/fail";
    // Nothing is listening on this port, so the request fails (11.10).
    const WRONG_PORT_URL = "http://localhost:3999/employees.json";

    // The elements of the "Remote employees" section on employees.html.
    const loadXhrButton = document.getElementById("load-xhr");
    const loadFetchButton = document.getElementById("load-fetch");
    const loadAsyncButton = document.getElementById("load-async");
    const loadJQueryButton = document.getElementById("load-jquery");
    const testServerErrorButton = document.getElementById("test-server-error");
    const testNetworkErrorButton = document.getElementById("test-network-error");
    const remoteStatus = document.getElementById("remote-status");
    const remoteSummary = document.getElementById("remote-summary");
    const remoteList = document.getElementById("remote-list");

    // Stop quietly if this page does not have the section.
    if (!remoteList || !remoteStatus) {
        return;
    }

    // ------------------------------------------------------
    // Messages and error helpers
    // ------------------------------------------------------

    // Shows a message to the user. Errors get an extra class so they show in red.
    function showStatus(text, isError) {
        remoteStatus.textContent = text;
        remoteStatus.className = isError ? "feedback feedback-error" : "feedback";
    }

    // An error for "the server answered, but with a bad status" (404, 500 ...).
    function createHttpError(status, statusText, serverMessage) {
        const error = new Error("The server replied with " + status + " " + statusText);
        error.status = status;
        error.statusText = statusText;
        error.serverMessage = serverMessage;
        return error;
    }

    // Turns any error into one friendly sentence for the user.
    function describeProblem(error) {
        // The server answered, but not with an OK status.
        if (error.status) {
            let text = "The server replied with an error: " + error.status;
            if (error.statusText) {
                text += " " + error.statusText;
            }
            if (error.serverMessage) {
                text += " - " + error.serverMessage;
            }
            return text;
        }

        // The data arrived but was not what we expected.
        // (response.json() throws a SyntaxError when the text is not valid JSON.)
        if (error instanceof SyntaxError) {
            return "The server sent data that is not valid JSON.";
        }
        if (error.isDataError) {
            return error.message;
        }

        // No answer at all: the request never reached the server (network failure).
        if (!navigator.onLine) {
            return "You are offline. Check your internet connection and try again.";
        }
        return "Could not reach the server. Check that it is running and try again.";
    }

    // Used as the .catch() handler everywhere.
    function handleProblem(error) {
        console.log("Request problem:", error);
        showStatus(describeProblem(error), true);
    }

    // ------------------------------------------------------
    // 11.1 and 11.2: XMLHttpRequest wrapped in a function that returns a Promise
    // ------------------------------------------------------
    function getEmployeesXHR(url) {
        return new Promise(function (resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url);

            // onload runs when a reply has arrived (whatever its status).
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        // The reply is text. JSON.parse turns it into JavaScript data.
                        resolve(JSON.parse(xhr.responseText));
                    } catch (parseError) {
                        const dataError = new Error("The server sent data that is not valid JSON.");
                        dataError.isDataError = true;
                        reject(dataError);
                    }
                } else {
                    reject(createHttpError(xhr.status, xhr.statusText));
                }
            };

            // onerror runs when the request could not be made at all.
            xhr.onerror = function () {
                reject(new Error("Network error"));
            };

            xhr.send();
        });
    }

    // ------------------------------------------------------
    // 11.3: Fetch API with an HTTP status check (response.ok)
    // ------------------------------------------------------
    function getEmployeesFetch(url) {
        return fetch(url).then(function (response) {
            // fetch only fails on network problems, so a 404 or 500 must be checked here.
            if (!response.ok) {
                throw createHttpError(response.status, response.statusText);
            }
            return response.json(); // read the reply and parse it as JSON
        });
    }

    // ------------------------------------------------------
    // 11.4: the same request with async/await and arrow functions
    // ------------------------------------------------------
    const getEmployeesAsync = async (url) => {
        const response = await fetch(url);

        if (!response.ok) {
            throw createHttpError(response.status, response.statusText);
        }

        return await response.json();
    };

    // ------------------------------------------------------
    // 11.6: process the remote data and show it in the "Remote employees" section
    // ------------------------------------------------------

    // The file may hold the list itself, or an object with an "employees" list.
    function toEmployeeArray(data) {
        if (Array.isArray(data)) {
            return data;
        }
        if (data && Array.isArray(data.employees)) {
            return data.employees;
        }
        const dataError = new Error("The employee data is not in the format expected.");
        dataError.isDataError = true;
        throw dataError;
    }

    // Adds one "Label: value" line to a card. textContent shows the value
    // as plain text, so data from a server can never add HTML to the page.
    function addLine(card, label, value) {
        const line = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = label + ": ";
        line.appendChild(strong);
        line.appendChild(document.createTextNode(String(value)));
        card.appendChild(line);
    }

    function createRemoteCard(employee) {
        const card = document.createElement("article");
        card.className = "card";

        const heading = document.createElement("h3");
        heading.textContent = employee.firstName + " " + employee.lastName;
        card.appendChild(heading);

        addLine(card, "Job title", employee.jobTitle);
        addLine(card, "Department", employee.department);
        addLine(card, "Email", employee.email);
        addLine(card, "Status", employee.status);
        addLine(card, "Training", employee.trainingHours + " of " + employee.trainingTarget + " hours");

        return card;
    }

    function showRemoteEmployees(data, technique) {
        const remoteEmployees = toEmployeeArray(data);

        // Process the data: sort by last name (arrow function) ...
        const sorted = remoteEmployees.slice().sort((a, b) =>
            String(a.lastName).localeCompare(String(b.lastName))
        );

        // ... and count the employees in each department.
        const countByDepartment = {};
        for (const employee of sorted) {
            countByDepartment[employee.department] = (countByDepartment[employee.department] || 0) + 1;
        }
        const departmentParts = Object.keys(countByDepartment).map((department) =>
            department + ": " + countByDepartment[department]
        );

        remoteSummary.textContent =
            sorted.length + " remote employees loaded using " + technique + ". " + departmentParts.join(" | ");

        // Draw one card per employee.
        remoteList.innerHTML = "";
        for (const employee of sorted) {
            remoteList.appendChild(createRemoteCard(employee));
        }

        showStatus("Loaded " + sorted.length + " employees from the server using " + technique + ".", false);
    }

    // ------------------------------------------------------
    // The four "Load" buttons: one technique each
    // ------------------------------------------------------

    // XMLHttpRequest (inside a Promise): .then() for success, .catch() for problems.
    loadXhrButton.addEventListener("click", function () {
        showStatus("Loading with XMLHttpRequest...", false);

        getEmployeesXHR(EMPLOYEES_URL)
            .then(function (data) {
                showRemoteEmployees(data, "XMLHttpRequest");
            })
            .catch(handleProblem);
    });

    // Fetch with .then() chains.
    loadFetchButton.addEventListener("click", function () {
        showStatus("Loading with Fetch...", false);

        getEmployeesFetch(EMPLOYEES_URL)
            .then(function (data) {
                showRemoteEmployees(data, "Fetch");
            })
            .catch(handleProblem);
    });

    // async/await with an arrow function: reads like normal top-to-bottom code.
    loadAsyncButton.addEventListener("click", async () => {
        showStatus("Loading with async/await...", false);

        try {
            const data = await getEmployeesAsync(EMPLOYEES_URL);
            showRemoteEmployees(data, "async/await");
        } catch (error) {
            handleProblem(error);
        }
    });

    // 11.5: the same request refactored with jQuery's $.getJSON.
    loadJQueryButton.addEventListener("click", function () {
        // jQuery is a separate library. Check it loaded before using it.
        if (typeof $ === "undefined") {
            showStatus("jQuery is not loaded. Check the jQuery script tag on this page.", true);
            return;
        }

        showStatus("Loading with jQuery...", false);

        $.getJSON(EMPLOYEES_URL)
            .done(function (data) {
                try {
                    showRemoteEmployees(data, "jQuery $.getJSON");
                } catch (error) {
                    handleProblem(error);
                }
            })
            .fail(function (jqXHR, textStatus) {
                if (textStatus === "parsererror") {
                    const dataError = new Error("The server sent data that is not valid JSON.");
                    dataError.isDataError = true;
                    handleProblem(dataError);
                } else if (jqXHR.status) {
                    // The server replied, but with an error status.
                    handleProblem(createHttpError(jqXHR.status, jqXHR.statusText));
                } else {
                    // Status 0: the request never reached the server.
                    handleProblem(new Error("Network error"));
                }
            });
    });

    // ------------------------------------------------------
    // 11.11: a non-OK status. /api/fail always replies 500.
    // ------------------------------------------------------
    testServerErrorButton.addEventListener("click", async () => {
        showStatus("Calling /api/fail...", false);

        try {
            const response = await fetch(FAIL_URL);

            if (!response.ok) {
                // The server sends { message: "..." } with its errors, so read it.
                const body = await response.json().catch(() => ({}));
                throw createHttpError(response.status, response.statusText, body.message);
            }

            showStatus("The server replied OK.", false);
        } catch (error) {
            handleProblem(error);
        }
    });

    // ------------------------------------------------------
    // 11.10: a network failure. A wrong port means nobody answers,
    // so fetch rejects and the catch block shows a friendly message.
    // ------------------------------------------------------
    testNetworkErrorButton.addEventListener("click", async () => {
        showStatus("Trying a wrong port...", false);

        try {
            await getEmployeesAsync(WRONG_PORT_URL);
            showStatus("The request worked (unexpected).", false);
        } catch (error) {
            handleProblem(error);
        }
    });

}
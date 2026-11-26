// training.js - canvas bar chart and ID badge
// Uses the AppData namespace from employee-data.js and employee-model.js (loaded first).
(function () {

    // get both canvases and their 2D drawing contexts.
    const chartCanvas = document.getElementById("training-chart");
    const chartContext = chartCanvas.getContext("2d");

    const badgeCanvas = document.getElementById("id-badge");
    const badgeContext = badgeCanvas.getContext("2d");

    // The form used to edit an employee's training hours.
    const hoursForm = document.getElementById("hours-form");
    const hoursEmployeeSelect = document.getElementById("hours-employee");
    const hoursInput = document.getElementById("hours-value");
    const hoursMessage = document.getElementById("hours-message");

    // Timer used to hide the pop-up message after a few seconds.
    let messageTimer;

    // The four departments from the Employee data model, in the order they are drawn.
    const DEPARTMENT_NAMES = ["Engineering", "Human Resources", "Finance", "Operations"];

    // One colour per bar, taken from the portal's palette.
    const BAR_COLOURS = ["#4f359b", "#585191", "#7d6f86", "#99907d"];
    const TEXT_COLOUR = "#2b2640";
    const TARGET_COLOUR = "#e67e22";

    // calculate totals per department (nothing is hard-coded)

    // Adds up one numeric field ("trainingHours" or "trainingTarget") for each
    // department and returns an object such as { Engineering: 66, Finance: 58, ... }.
    function calculateTotals(fieldName) {
        const totals = {};

        // Start every department on 0 so a department with nobody still gets a bar.
        DEPARTMENT_NAMES.forEach(function (name) {
            totals[name] = 0;
        });

        // forEach visits every employee and adds their number to their department.
        AppData.employees.forEach(function (employee) {
            if (totals[employee.department] !== undefined) {
                totals[employee.department] += Number(employee[fieldName]);
            }
        });

        return totals;
    }

    // draw the bar chart
    function drawBarChart() {
        const hoursTotals = calculateTotals("trainingHours");
        const targetTotals = calculateTotals("trainingTarget");

        const ctx = chartContext;
        const width = chartCanvas.width;
        const height = chartCanvas.height;

        // Space left around the plotting area for labels and the title.
        const margin = { top: 85, right: 30, bottom: 70, left: 75 };
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;
        const baseY = margin.top + plotHeight; // the y position of the X axis

        // Find the largest value (hours or target) so the tallest bar fits the chart.
        const allValues = [];
        DEPARTMENT_NAMES.forEach(function (name) {
            allValues.push(hoursTotals[name], targetTotals[name]);
        });
        const largestValue = Math.max(...allValues, 10);

        // Round the top of the Y axis up to a tidy number: 5 steps of 10, 20, 30...
        const tickStep = Math.ceil(largestValue / 5 / 10) * 10;
        const axisMax = tickStep * 5;

        // Start with a clean white canvas (so redrawing never stacks images).
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        // chart title.
        ctx.fillStyle = TEXT_COLOUR;
        ctx.font = "bold 24px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Total Training Hours by Department", width / 2, 36);

        // Legend for the dashed target line.
        ctx.strokeStyle = TARGET_COLOUR;
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        ctx.moveTo(margin.left, 62);
        ctx.lineTo(margin.left + 50, 62);
        ctx.stroke();
        ctx.setLineDash([]); // back to solid lines
        ctx.fillStyle = TEXT_COLOUR;
        ctx.font = "15px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("Yearly training target (hours required)", margin.left + 60, 67);

        // Light grid lines, tick marks and Y axis numbers.
        ctx.font = "14px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "right";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const tickValue = i * tickStep;
            const y = baseY - (tickValue / axisMax) * plotHeight;

            ctx.strokeStyle = "#e5e2ea";
            ctx.beginPath();
            ctx.moveTo(margin.left, y);
            ctx.lineTo(margin.left + plotWidth, y);
            ctx.stroke();

            ctx.fillStyle = TEXT_COLOUR;
            ctx.fillText(String(tickValue), margin.left - 10, y + 5);
        }

        // draw one bar per department with a for loop and fillRect().
        const slotWidth = plotWidth / DEPARTMENT_NAMES.length; // space for each department
        const barWidth = slotWidth * 0.5;

        for (let i = 0; i < DEPARTMENT_NAMES.length; i++) {
            const name = DEPARTMENT_NAMES[i];
            const value = hoursTotals[name];

            // Bar height is the value as a fraction of the maximum, times the plot height.
            const barHeight = (value / axisMax) * plotHeight;
            const x = margin.left + i * slotWidth + (slotWidth - barWidth) / 2;
            const y = baseY - barHeight;

            ctx.fillStyle = BAR_COLOURS[i % BAR_COLOURS.length];
            ctx.fillRect(x, y, barWidth, barHeight);

            // the value above the bar and the department name below the axis.
            ctx.fillStyle = TEXT_COLOUR;
            ctx.textAlign = "center";
            ctx.font = "bold 16px 'Segoe UI', Arial, sans-serif";
            ctx.fillText(value + " h", x + barWidth / 2, y - 8);

            ctx.font = "15px 'Segoe UI', Arial, sans-serif";
            ctx.fillText(name, x + barWidth / 2, baseY + 28);
        }

        // dashed target line. Each department has its own target,
        // so one dashed mark is drawn across each department's slot.
        ctx.strokeStyle = TARGET_COLOUR;
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        for (let i = 0; i < DEPARTMENT_NAMES.length; i++) {
            const targetY = baseY - (targetTotals[DEPARTMENT_NAMES[i]] / axisMax) * plotHeight;
            ctx.moveTo(margin.left + i * slotWidth + 8, targetY);
            ctx.lineTo(margin.left + (i + 1) * slotWidth - 8, targetY);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // X and Y axes with moveTo() and lineTo().
        ctx.strokeStyle = TEXT_COLOUR;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);  // top of the Y axis
        ctx.lineTo(margin.left, baseY);       // down to the corner
        ctx.lineTo(margin.left + plotWidth, baseY); // across to the right: the X axis
        ctx.stroke();

        // Axis title for the Y axis (turned sideways).
        ctx.save();
        ctx.translate(20, margin.top + plotHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = TEXT_COLOUR;
        ctx.font = "15px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Training hours", 0, 0);
        ctx.restore();

        // Keep the screen-reader description in step with the numbers drawn.
        const summary = DEPARTMENT_NAMES.map(function (name) {
            return name + " " + hoursTotals[name] + " of " + targetTotals[name] + " hours";
        }).join(", ");
        chartCanvas.setAttribute("aria-label",
            "Bar chart of total training hours by department compared with the yearly target: " + summary + ".");
    }

    // draw the ID badge for employees[0]
    function drawBadge() {
        const person = AppData.employees[0];
        const ctx = badgeContext;
        const width = badgeCanvas.width;
        const height = badgeCanvas.height;
        const centreX = width / 2;

        ctx.clearRect(0, 0, width, height);

        // Badge body: a white rectangle with a thick indigo border.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "#4f359b";
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, width - 6, height - 6);

        // Header band with the lanyard slot and company name.
        ctx.fillStyle = "#4f359b";
        ctx.fillRect(3, 3, width - 6, 115);

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(centreX - 30, 18, 60, 12); // lanyard slot

        ctx.textAlign = "center";
        ctx.font = "bold 20px 'Segoe UI', Arial, sans-serif";
        ctx.fillText("CodeSphere Technologies", centreX, 66, width - 40);
        ctx.font = "14px 'Segoe UI', Arial, sans-serif";
        ctx.fillText("EMPLOYEE ID BADGE", centreX, 94);

        // Photo placeholder: a circle with the employee's initials (no real photos).
        ctx.fillStyle = "#b5ba72";
        ctx.beginPath();
        ctx.arc(centreX, 180, 48, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#2b2640";
        ctx.font = "bold 34px 'Segoe UI', Arial, sans-serif";
        ctx.textBaseline = "middle";
        ctx.fillText(person.getInitials(), centreX, 182);
        ctx.textBaseline = "alphabetic";

        // Name, job title and department. The last number in fillText() is a
        // maximum width, so long names shrink to fit instead of overflowing.
        ctx.fillStyle = "#2b2640";
        ctx.font = "bold 24px 'Segoe UI', Arial, sans-serif";
        ctx.fillText(person.getFullName(), centreX, 265, width - 40);

        ctx.font = "17px 'Segoe UI', Arial, sans-serif";
        ctx.fillText(person.jobTitle, centreX, 295, width - 40);

        ctx.fillStyle = "#585191";
        ctx.font = "bold 17px 'Segoe UI', Arial, sans-serif";
        ctx.fillText(person.department, centreX, 322, width - 40);

        // ID number and start date.
        ctx.fillStyle = "#2b2640";
        ctx.font = "15px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("ID: CS-" + String(person.id).padStart(4, "0"), 30, 358);
        ctx.fillText("Started: " + person.startDate, 30, 383);

        // Training progress bar: outline, then a filled part.
        const barX = 30;
        const barY = 430;
        const barWidth = width - 60;
        const progress = Math.min(1, person.trainingHours / person.trainingTarget);

        ctx.fillText("Training: " + person.trainingHours + " / " + person.trainingTarget + " hours", barX, barY - 9);
        ctx.strokeStyle = "#2b2640";
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, 18);
        ctx.fillStyle = "#585191";
        ctx.fillRect(barX, barY, barWidth * progress, 18);
    }

    // Edit an employee's training hours and redraw (before/after evidence)

    // Put every employee in the dropdown.
    function fillEmployeeSelect() {
        for (const employee of AppData.employees) {
            const option = document.createElement("option");
            option.value = employee.id;
            option.textContent = employee.getFullName() + " (" + employee.department + ")";
            hoursEmployeeSelect.appendChild(option);
        }
    }

    // Find the employee currently chosen in the dropdown.
    function getSelectedEmployee() {
        return AppData.employees.find(function (employee) {
            return employee.id === Number(hoursEmployeeSelect.value);
        });
    }

    // Show that employee's current hours in the number box.
    function showSelectedHours() {
        const employee = getSelectedEmployee();
        if (employee) {
            hoursInput.value = employee.trainingHours;
        }
    }

    hoursEmployeeSelect.addEventListener("change", showSelectedHours);

    hoursForm.addEventListener("submit", function (event) {
        event.preventDefault(); // stay on the page

        const employee = getSelectedEmployee();
        employee.trainingHours = Number(hoursInput.value);

        // Redraw both canvases from the updated array.
        drawBarChart();
        drawBadge();

        hoursMessage.textContent =
            employee.getFullName() + " now has " +
            employee.trainingHours + " training hours. The chart has been updated.";

        // Hide the pop-up again after 5 seconds.
        clearTimeout(messageTimer);
        messageTimer = setTimeout(function () {
            hoursMessage.textContent = "";
        }, 5000);
    });

    // Start the page: fill the form, then draw everything.
    fillEmployeeSelect();
    showSelectedHours();
    drawBarChart();
    drawBadge();

})();
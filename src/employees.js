// display, filter, edit and drag employees

// Imports what it needs from data.js and classes.js and exports one
// function, initEmployeeDirectory(), that main.js calls.
import { employees, statusOptions } from "./data.js";
import { DEPARTMENTS, refreshTeamSizes } from "./classes.js";

export function initEmployeeDirectory() {

    // Grab the elements on employees.html that we need to work with.
    const employeeList = document.getElementById("employee-list");
    const departmentFilter = document.getElementById("department-filter");
    const dropZonesContainer = document.getElementById("drop-zones");
    const dropMessage = document.getElementById("drop-message");

    // remembers which department is selected in the filter.
    let selectedDepartment = "All";

    // Timer used to clear the drop message after a few seconds.
    let dropMessageTimer;

    // a reusable, single-purpose function. It makes text safe to place
    // inside HTML, and it is used for every value that is put into a card or form.
    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    // Fill the filter dropdown with one option per department.
    function populateDepartmentFilter() {
        // add an <option> for every department.
        for (const department of DEPARTMENTS) {
            const option = document.createElement("option");
            option.value = department;
            option.textContent = department;
            departmentFilter.appendChild(option);
        }
    }

    // Build one employee card using createElement and a template literal.
    // the card now asks the Employee object for its text.
    function createEmployeeCard(employee) {
        const card = document.createElement("article");
        card.className = "card";

        card.innerHTML = `
            <h3>${escapeHtml(employee.getFullName())}</h3>
            <p class="role-label">${escapeHtml(employee.getRoleLabel())}</p>
            <p><strong>Job title:</strong> ${escapeHtml(employee.jobTitle)}</p>
            <p><strong>Department:</strong> ${escapeHtml(employee.department)}</p>
            <p><strong>Email:</strong> ${escapeHtml(employee.email)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(employee.phone)}</p>
            <p><strong>Start date:</strong> ${escapeHtml(employee.startDate)}</p>
            <p><strong>Training:</strong> ${employee.trainingHours} of ${employee.trainingTarget} hours (${employee.getTrainingProgress()}%)</p>
            <progress max="100" value="${employee.getTrainingProgress()}" aria-label="Training progress">${employee.getTrainingProgress()}%</progress>
            <p><strong>Status:</strong> ${escapeHtml(employee.status)}</p>
        `;

        // Edit button: a click opens the inline edit form.
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", function () {
            showEditForm(card, employee);
        });
        card.appendChild(editButton);

        // make the card draggable and let it carry the employee's id.
        card.draggable = true;

        card.addEventListener("dragstart", function (event) {
            // setData stores the id so the drop target can read it back.
            event.dataTransfer.setData("text/plain", String(employee.id));
            event.dataTransfer.effectAllowed = "move";
            card.classList.add("dragging");
        });

        card.addEventListener("dragend", function () {
            card.classList.remove("dragging");
        });

        return card;
    }

    // Replace the card's content with an edit form pre-filled with the current values.
    function showEditForm(card, employee) {
        // A draggable card would stop the mouse selecting text in the form fields.
        card.draggable = false;

        card.innerHTML = `
            <h3>Edit ${escapeHtml(employee.getFullName())}</h3>
            <form class="employee-edit-form">
                <label for="job-title-${employee.id}">Job title</label>
                <input type="text" id="job-title-${employee.id}" value="${escapeHtml(employee.jobTitle)}" required>

                <label for="phone-${employee.id}">Phone</label>
                <input type="tel" id="phone-${employee.id}" value="${escapeHtml(employee.phone)}" required>

                <label for="status-${employee.id}">Status</label>
                <select id="status-${employee.id}"></select>

                <button type="submit">Save</button>
                <button type="button" class="cancel-button">Cancel</button>
            </form>
        `;

        const form = card.querySelector("form");
        const statusSelect = card.querySelector("select");

        // add each allowed status as an option in the dropdown.
        for (const status of statusOptions) {
            const option = document.createElement("option");
            option.value = status;
            option.textContent = status;
            statusSelect.appendChild(option);
        }

        // Pre-select the employee's current status in the dropdown.
        statusSelect.value = employee.status;

        // update the object in the array, then re-render without reloading.
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            employee.jobTitle = card.querySelector(`#job-title-${employee.id}`).value.trim();
            employee.phone = card.querySelector(`#phone-${employee.id}`).value.trim();
            employee.status = statusSelect.value;
            renderEmployees();
        });

        // Cancel: throw away changes and redraw the cards.
        card.querySelector(".cancel-button").addEventListener("click", renderEmployees);
    }

    // Draw the cards that match the current filter.
    function renderEmployees() {
        // Clear the container so cards are not duplicated.
        employeeList.innerHTML = "";

        // show everyone, or only the chosen department.
        let visibleEmployees;
        if (selectedDepartment === "All") {
            visibleEmployees = employees;
        } else {
            visibleEmployees = employees.filter((employee) => employee.department === selectedDepartment);
        }

        // create and add a card for each visible employee.
        for (const employee of visibleEmployees) {
            employeeList.appendChild(createEmployeeCard(employee));
        }
    }

    // Task 10: department drop targets

    // Shows a message under the drop zones and clears it after 5 seconds.
    function showDropMessage(text) {
        dropMessage.textContent = text;

        clearTimeout(dropMessageTimer);
        dropMessageTimer = setTimeout(function () {
            dropMessage.textContent = "";
        }, 5000);
    }

    // change the employee's department in the array, then re-render.
    function moveEmployeeToDepartment(employeeId, newDepartment) {
        const employee = employees.find((item) => item.id === employeeId);

        // Something else was dropped (for example a file), so ignore it.
        if (!employee) {
            return;
        }

        if (employee.department === newDepartment) {
            showDropMessage(employee.getFullName() + " is already in " + newDepartment + ".");
            return;
        }

        const oldDepartment = employee.department;
        employee.department = newDepartment; // update the array

        refreshTeamSizes(); // managers' team sizes change when people move
        renderEmployees(); // draw the cards again with the new department

        showDropMessage(
            employee.getFullName() + " moved from " + oldDepartment + " to " + newDepartment + "."
        );
    }

    // build one drop target for each department.
    function createDropZones() {
        for (const department of DEPARTMENTS) {
            const zone = document.createElement("div");
            zone.className = "drop-zone";
            zone.dataset.department = department;

            const name = document.createElement("strong");
            name.textContent = department;
            const hint = document.createElement("span");
            hint.textContent = "Drop here";
            zone.appendChild(name);
            zone.appendChild(hint);

            // dragover fires again and again while a card is held over the zone.
            zone.addEventListener("dragover", function (event) {
                // Without preventDefault() the browser refuses to allow a drop.
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                zone.classList.add("drag-over");
            });

            zone.addEventListener("dragleave", function () {
                zone.classList.remove("drag-over");
            });

            // drop fires when the card is released over the zone.
            zone.addEventListener("drop", function (event) {
                event.preventDefault(); // stop the browser trying to open the data
                zone.classList.remove("drag-over");

                // Read back the id that dragstart stored.
                const employeeId = Number(event.dataTransfer.getData("text/plain"));
                moveEmployeeToDepartment(employeeId, department);
            });

            dropZonesContainer.appendChild(zone);
        }
    }

    // build the dropdown and drop zones, then show all employees.
    function init() {
        // a change event on the select re-renders the list.
        departmentFilter.addEventListener("change", function () {
            selectedDepartment = departmentFilter.value;
            renderEmployees();
        });

        populateDepartmentFilter();
        createDropZones();
        renderEmployees();
    }

    init();
}
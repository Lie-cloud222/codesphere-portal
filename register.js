// ==========================================================
// register.js - Task 4 (registration form), Task 5 (draft + offline),
//               Task 11 (send the new employee to the server)
// Uses the AppData namespace from employee-data.js and employee-model.js (loaded first).
// ==========================================================
(function () {

    // Grab the form, its fields and the message area.
    const registerForm = document.getElementById("EmployeeReg");
    const firstNameInput = document.getElementById("first-name");
    const lastNameInput = document.getElementById("last-name");
    const emailInput = document.getElementById("email");
    const departmentSelect = document.getElementById("department");
    const jobTitleInput = document.getElementById("job-title");
    const startDateInput = document.getElementById("start-date");
    const phoneInput = document.getElementById("cell");
    const successMessage = document.getElementById("success-message");

    // Every new employee starts with no training done and this yearly target.
    const DEFAULT_TRAINING_TARGET = 40;

    // Key under which the draft is stored in localStorage (Task 5).
    const DRAFT_KEY = "employeeRegistrationDraft";

    // Timer used to hide the success pop-up after a few seconds.
    let messageTimer;

    // ----------------------------------------------------------
    // Task 4: validation helpers
    // ----------------------------------------------------------

    // Returns true if the email is already used by an employee in the array.
    // Both sides are lower-cased so "A@x.com" and "a@x.com" count as the same.
    function emailExists(email) {
        const wanted = email.trim().toLowerCase();
        return AppData.employees.some(function (employee) {
            return employee.email.toLowerCase() === wanted;
        });
    }

    // Custom validation: block submission if the email is taken.
    function checkEmail() {
        if (emailExists(emailInput.value)) {
            emailInput.setCustomValidity("Email already exists");
        } else {
            emailInput.setCustomValidity(""); // empty string = the field is valid again
        }
    }

    // ----------------------------------------------------------
    // Task 5, steps 1-3: save and restore a draft with localStorage
    // ----------------------------------------------------------

    // Step 1: turn the form fields into a JSON string and store it.
    // try/catch (step 3) in case the browser blocks localStorage.
    function saveDraft() {
        const draft = {
            firstName: firstNameInput.value,
            lastName: lastNameInput.value,
            email: emailInput.value,
            department: departmentSelect.value,
            jobTitle: jobTitleInput.value,
            startDate: startDateInput.value,
            phone: phoneInput.value
        };

        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        } catch (error) {
            console.log("Could not save the draft:", error);
        }
    }

    // Step 2: when the page loads, read the draft back and fill the form.
    function loadDraft() {
        try {
            const savedDraft = localStorage.getItem(DRAFT_KEY);

            if (savedDraft) {
                const draft = JSON.parse(savedDraft);

                firstNameInput.value = draft.firstName || "";
                lastNameInput.value = draft.lastName || "";
                emailInput.value = draft.email || "";
                departmentSelect.value = draft.department || "";
                jobTitleInput.value = draft.jobTitle || "";
                startDateInput.value = draft.startDate || "";
                phoneInput.value = draft.phone || "";

                // Setting values in code does not fire "input", so re-check the email.
                checkEmail();
            }
        } catch (error) {
            console.log("Could not load the draft:", error);
        }
    }

    // Remove the draft once the employee has been registered.
    function clearDraft() {
        try {
            localStorage.removeItem(DRAFT_KEY);
        } catch (error) {
            console.log("Could not clear the draft:", error);
        }
    }

    // ----------------------------------------------------------
    // Task 5, step 6: online / offline status indicator
    // ----------------------------------------------------------

    // Create the status message and put it just above the form.
    const connectionStatus = document.createElement("p");
    connectionStatus.id = "connection-status";
    connectionStatus.setAttribute("role", "status"); // announced politely by screen readers
    registerForm.before(connectionStatus);

    // navigator.onLine is true when the browser has a connection.
    function updateConnectionStatus() {
        if (navigator.onLine) {
            connectionStatus.textContent = "You are online.";
            connectionStatus.className = "connection-status is-online";
        } else {
            connectionStatus.textContent =
                "You are offline. Your draft is saved on this device and the portal still works from the cache.";
            connectionStatus.className = "connection-status is-offline";
        }
    }

    window.addEventListener("online", updateConnectionStatus);
    window.addEventListener("offline", updateConnectionStatus);
    updateConnectionStatus(); // show the correct message as soon as the page loads

    // ----------------------------------------------------------
    // Task 5, step 5: register the service worker
    // ----------------------------------------------------------
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", function () {
            navigator.serviceWorker.register("/sw.js")
                .then(function (registration) {
                    console.log("Service worker registered. Scope:", registration.scope);
                })
                .catch(function (error) {
                    console.log("Service worker registration failed:", error);
                });
        });
    }

    // ----------------------------------------------------------
    // Task 11: send the new employee to the server (POST /api/employees)
    // ----------------------------------------------------------

    // Returns { ok, text } and never throws, so the caller can always show the text.
    async function sendEmployeeToServer(employee) {
        // 11.7: serialise the object, which turns it into a JSON string.
        const employeeJson = JSON.stringify(employee);

        try {
            // 11.8: send the JSON text with a POST request using fetch.
            const response = await fetch("/api/employees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: employeeJson
            });

            // 11.9: the server replies with JSON such as { message: "..." }.
            const result = await response.json().catch(function () {
                return {};
            });

            if (response.ok) {
                return { ok: true, text: "Server replied " + response.status + ": " + (result.message || response.statusText) };
            }
            return { ok: false, text: "The server did not accept it (" + response.status + "): " + (result.message || response.statusText) };

        } catch (error) {
            // 11.10: the request never reached the server (network failure).
            if (!navigator.onLine) {
                return { ok: false, text: "You are offline, so the server was not told yet." };
            }
            return { ok: false, text: "Could not reach the server." };
        }
    }

    // ----------------------------------------------------------
    // Event listeners
    // ----------------------------------------------------------

    // Check the email while the user types, so the message is ready
    // before they press Submit.
    emailInput.addEventListener("input", checkEmail);

    // Step 1: every time anything in the form changes, save the draft.
    registerForm.addEventListener("input", saveDraft);

    // Clear the old success message as soon as the user starts a new entry.
    registerForm.addEventListener("input", function () {
        successMessage.textContent = "";
    });

    // The browser runs the HTML5 checks (required, type="email", phone pattern)
    // first. This event only fires when all of them have passed.
    registerForm.addEventListener("submit", function (event) {
        event.preventDefault(); // stay on the page

        // Final safety check on the email before saving.
        checkEmail();
        if (!registerForm.checkValidity()) {
            registerForm.reportValidity();
            return;
        }

        // Build the new employee object using every field of the data model.
        const newEmployeeData = {
            id: AppData.getNextEmployeeId(),
            firstName: firstNameInput.value.trim(),
            lastName: lastNameInput.value.trim(),
            email: emailInput.value.trim(),
            phone: phoneInput.value.trim(),
            // Use the visible text ("Human Resources"), not the option value.
            department: departmentSelect.options[departmentSelect.selectedIndex].text,
            jobTitle: jobTitleInput.value.trim(),
            startDate: startDateInput.value, // already YYYY-MM-DD
            status: "Active",
            trainingHours: 0,
            trainingTarget: DEFAULT_TRAINING_TARGET
        };

        // Task 12: AppData.addEmployee() makes an Employee (or Manager) object,
        // adds it to the list and remembers it for the next visit.
        const newEmployee = AppData.addEmployee(newEmployeeData);

        console.log("New employee added:", newEmployee);
        console.log("Employees array now has " + AppData.employees.length + " employees:", AppData.employees);

        // The paragraph has aria-live="polite", so screen readers announce this text.
        const registeredText =
            newEmployee.getFullName() + " was registered successfully in " + newEmployee.department + ".";
        successMessage.textContent = registeredText;

        // Hide the pop-up again after 5 seconds.
        clearTimeout(messageTimer);
        messageTimer = setTimeout(function () {
            successMessage.textContent = "";
            successMessage.classList.remove("has-error");
        }, 5000);

        // Task 11: send the new employee to the server and add its reply to the pop-up.
        sendEmployeeToServer(newEmployee).then(function (reply) {
            successMessage.textContent = registeredText + " " + reply.text;
            successMessage.classList.toggle("has-error", !reply.ok);

            // Keep the reply on screen a little longer.
            clearTimeout(messageTimer);
            messageTimer = setTimeout(function () {
                successMessage.textContent = "";
                successMessage.classList.remove("has-error");
            }, 8000);
        });

        // The employee is saved, so the draft is no longer needed.
        clearDraft();
        registerForm.reset();
        firstNameInput.focus();
    });

    // Step 2: fill the form from a saved draft (runs once, when the page loads).
    loadDraft();

})();
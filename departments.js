// Loaded as an ES6 module: <script type="module" src="departments.js">
 
// import the employees array.
import { employees } from "./employees-export.js";
 
// Every clickable department shape on the map, and the area for the details.
const departmentShapes = document.querySelectorAll(".department");
const departmentDetails = document.getElementById("department-details");
 
// A short, fictitious description for each department.
const departmentDescriptions = {
    "Engineering": "Builds and maintains the software that CodeSphere delivers to its clients.",
    "Human Resources": "Looks after hiring, payroll, training and the wellbeing of our people.",
    "Finance": "Manages budgets, invoicing and financial reporting for the company.",
    "Operations": "Keeps day-to-day work running smoothly, from logistics to technical support."
};
 
// exactly as it appears in the data, for example:
//     "Engineering": "Thandi Nkosi",
// Any department you leave out gets a head chosen automatically (see below).
const departmentHeadNames = {
};
 
// Work out who the head of a department is.
function findHeadOfDepartment(departmentName, members) {
    // A head that was named on purpose above.
    const chosenName = departmentHeadNames[departmentName];
    if (chosenName) {
        const chosen = members.find(function (employee) {
            return employee.firstName + " " + employee.lastName === chosenName;
        });
        if (chosen) {
            return chosen;
        }
    }
 
    // Someone whose job title says they lead the team.
    const leader = members.find(function (employee) {
        return /\b(manager|head|lead|director)\b/i.test(employee.jobTitle);
    });
    if (leader) {
        return leader;
    }
 
    // Otherwise the longest-serving employee (earliest start date).
    // The dates are YYYY-MM-DD, so comparing them as text puts the oldest first.
    const bySeniority = members.slice().sort(function (a, b) {
        return a.startDate.localeCompare(b.startDate);
    });
    return bySeniority[0] || null; // null when the department has no employees
}
 
// work out and display the details of one department.
function showDepartmentDetails(departmentName) {
    // .filter() keeps only the employees whose department matches.
    const members = employees.filter(function (employee) {
        return employee.department === departmentName;
    });
 
    // The headcount is simply how many employees were kept.
    const headcount = members.length;
 
    // Two more filters give a breakdown by status.
    const activeCount = members.filter(function (employee) {
        return employee.status === "Active";
    }).length;
 
    const onLeaveCount = members.filter(function (employee) {
        return employee.status === "On leave";
    }).length;
 
    const head = findHeadOfDepartment(departmentName, members);
    const headText = head
        ? head.firstName + " " + head.lastName + " (" + head.jobTitle + ")"
        : "Not assigned yet";
 
    // Fill the details area below the map. The head's name comes from the data,
    // so it is added with textContent (below) and not typed into this template.
    departmentDetails.innerHTML = `
        <h3>${departmentName}</h3>
        <p>${departmentDescriptions[departmentName] || ""}</p>
        <p><strong>Head of department:</strong> <span id="department-head"></span></p>
        <p><strong>Headcount:</strong> ${headcount}</p>
        <p><strong>Active:</strong> ${activeCount} | <strong>On Leave:</strong> ${onLeaveCount}</p>
        <p><strong>Team members:</strong></p>
    `;
    departmentDetails.querySelector("#department-head").textContent = headText;
 
    // Build the list with textContent so names are always shown as plain text.
    const memberList = document.createElement("ul");
 
    for (const member of members) {
        const item = document.createElement("li");
        item.textContent = member.firstName + " " + member.lastName + " - " + member.jobTitle;
        memberList.appendChild(item);
    }
 
    if (members.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.textContent = "No employees in this department yet.";
        memberList.appendChild(emptyItem);
    }
 
    departmentDetails.appendChild(memberList);
}
 
// mark ONE shape as selected and every other shape as not selected.
function selectDepartment(selectedShape) {
    for (const shape of departmentShapes) {
        // true only for the shape that was clicked, false for the other three.
        const isSelected = (shape === selectedShape);
 
        // classList.toggle(name, true) adds the class; toggle(name, false) removes it.
        // The second value MUST be true/false, or every shape ends up highlighted.
        shape.classList.toggle("active", isSelected);
 
        // Tell screen readers which shape is currently pressed.
        shape.setAttribute("aria-pressed", String(isSelected));
    }
 
    showDepartmentDetails(selectedShape.dataset.department);
}
 
// listen for a click AND for the keyboard on every shape.
for (const shape of departmentShapes) {
    shape.addEventListener("click", function () {
        selectDepartment(shape);
    });
 
    shape.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault(); // stop the Space key from scrolling the page
            selectDepartment(shape);
        }
    });
}
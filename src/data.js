// The employee data

// "export" makes a name available to other modules, which use "import" to get it.
// Nothing here is global any more.
export const employees = [
    { id: 1, firstName: "Thandi", lastName: "Nkosi",
        email: "thandi.nkosi@codesphere.example", phone: "021 555 0107",
        department: "Engineering", jobTitle: "Senior Developer", startDate: "2019-03-04",
        status: "Active", trainingHours: 18, trainingTarget: 24
    },
    { id: 2, firstName: "Pieter", lastName: "van der Merwe",
        email: "pieter.vandermerwe@codesphere.example", phone: "021 555 0114",
        department: "Engineering", jobTitle: "Software Developer", startDate: "2021-07-12",
        status: "Active", trainingHours: 12, trainingTarget: 24
    },
    { id: 3, firstName: "Aisha", lastName: "Patel",
        email: "aisha.patel@codesphere.example", phone: "021 555 0121",
        department: "Engineering", jobTitle: "Junior Developer", startDate: "2024-02-01",
        status: "Active", trainingHours: 6, trainingTarget: 24
    },
    { id: 4, firstName: "Sipho", lastName: "Dlamini",
        email: "sipho.dlamini@codesphere.example", phone: "021 555 0128",
        department: "Human Resources", jobTitle: "HR Manager", startDate: "2018-09-17",
        status: "Active", trainingHours: 20, trainingTarget: 20
    },
    { id: 5, firstName: "Lerato", lastName: "Mokoena",
        email: "lerato.mokoena@codesphere.example", phone: "021 555 0135",
        department: "Human Resources", jobTitle: "Recruitment Officer", startDate: "2022-05-23",
        status: "On leave", trainingHours: 8, trainingTarget: 20
    },
    { id: 6, firstName: "Johan", lastName: "Botha",
        email: "johan.botha@codesphere.example", phone: "021 555 0142",
        department: "Finance", jobTitle: "Financial Accountant", startDate: "2017-11-06",
        status: "Active", trainingHours: 14, trainingTarget: 16
    },
    { id: 7, firstName: "Naledi", lastName: "Khumalo",
        email: "naledi.khumalo@codesphere.example", phone: "021 555 0149",
        department: "Finance", jobTitle: "Payroll Administrator", startDate: "2020-01-27",
        status: "Active", trainingHours: 10, trainingTarget: 16
    },
    { id: 8, firstName: "Zanele", lastName: "Ndlovu",
        email: "zanele.ndlovu@codesphere.example", phone: "021 555 0156",
        department: "Finance", jobTitle: "Finance Intern", startDate: "2025-01-13",
        status: "Active", trainingHours: 4, trainingTarget: 16
    },
];
//The two allowed status values
export const statusOptions = ["Active", "On Leave"];

// Employees added on register.html are saved in browser
const STORAGE_KEY = "registeredEmployees";

// Load any saved registrations into employees array
try {
    const savedEmployees = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    for (const employee of savedEmployees) {
        employees.push(employee);
    }
} catch (error) {
    console.log("Could not load saved employees:", error);
}

// Save one newly registered employee
export function saveRegisteredEmployee(employee) {
    try {
        const savedEmployees = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        savedEmployees.push(employee);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedEmployees));
    }catch (error) {
        console.log("Could not save employee:", error)
    }
}
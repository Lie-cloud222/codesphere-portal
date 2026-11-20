// The Employee and Manager classes

//Imports the data from data.js and exports the classes and helper functions that the other modules need
import { employees, saveRegisteredEmployee } from "./data";

// The 4 departments from the Employee data model
export const DEPARTMENTS = ["Engineering", "Human Resource", "Finance", "Operations"];

// The largest salary the setter will accept 
const MAX_SALARY = 1000000;

// Extend an existing prototype with extra behaviour using a mixin.
// A mixin is an object full of methods that is copied onto a class.
const ContactMixin = {
    // The first letter of the first and last name
    getInitials() {
        return this.firstName,charAt(0) + this.lastName.charAt(0);
    },
    // One line with the ways to reach this person
    getContactLine() {
        return this.email + " | " + this.phones;
    }
};

// The Employee class
export class Employee {
    // Encapsulation: a private field. The # means code outside this class cannot read or change it,
    // so the only way in is the getter and setter below, which check the value first
    #salary = 0;

    // The constructor creates the properties from the data model
    constructor(data) {
        this.id = data.id;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.email = data.email;
        this.phone = data.phone;
        this.department = data.department;
        this.jobTitle = data.jobTitle;
        this.startDate = data.startDate;
        this.status = data.status;
        this.trainingHours = data.trainingHours;
        this.trainingTarget = data.trainingTarget;

        // The salary is optional. When it is given, it goes through the setter
        if (data.salary !== undefined) {
            this.salary = data.salary;
        }
    }
    // The getter lets other code read the private field
    get salary() {
        return this.#salary;
    }

    // The setter validates the value before it is stored
    set salary(value) {
        if (typeof value !== "number" || Number.isNaN(value)) {
            throw new TypeError("Salary must be a number.");
        }
        if (value < 0 || value > MAX_SALARY) {
            throw new RangeError("Salary must be between 0 and " + MAX_SALARY + ".");
        }
        this.#salary = value;
    }

    // method 1: One place that joins the first and last name
    getFullName() {
        return this.firstName + " " + this.lastName;
    }
    // method 2: Training done as a whole-number percentage (never above 100)
    getTrainingProgress() {
        if (this.trainingTarget <= 0) {
            return 0;
        }
        const percentage = Math.round((this.trainingHours / this.trainingTarget) * 100);
        return Math.min(percentage, 100);
    }
    // method 3: A label for the kind of employee. Manager overrides thid=s
    getRoleLabel() {
        return "Employee";
    }

    // Only the fields of the data model are turned into JSON. The salary is private, 
    // and teamSize is worked out again, so neither is sent or saved
    toJSON() {
        return {
            id: this.id,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            phone: this.phone,
            department: this.department,
            jobTitle: this.jobTitle,
            startDate: this.startDate,
            status: this.status,
            trainingHours: this.trainingHours,
            trainingTarget: this.trainingTarget
        };
    }
}

// Copy the mixin's methods onto Employee.prototype.
// Every Employee (and every Manager) can now call getInitials() and getContactLine()
Object.assign(Employee.prototype, ContactMixin);

// a Manager is an Employee that leads a team
export class Manager extends Employee {
    constructor(data, teamSize = 0) {
        super(data); // run the Employee constructor first
        this.teamSize = teamSize; // the extra property
    }

    // override getRoleLabel() and call the parent version with super
    getRoleLabel() {
        const peopleText = this.teamSize === 1 ? "1 person" : this.teamSize + " people";
        return super.getRoleLabel() + " (manager of " + peopleText + ")";
    }
}

// Helper function. Each one does a single job.

// A job title containing the word "manager" becomes a Manager object.
export function createEmployee(data) {
    if (/\bmanager\b/i.test(data.jobTitle)) {
        return new Manager(data, 0);
    }
    return new Employee(data);
}
// A manager's team is everyone else in the same department.
// Run this again whenever people are added or moved
export function refreshTeamSizes() {
        for (const person of employees) {
            if (person instanceof Manager) {
                person.teamSize = employees.filter(
                    (colleague) => colleague !== person && colleague.department === person.department
                ).length;
            }
        }
    }
    // One higher than the last id in use.
    export function getNextEmployeeId() {
        let highestId = 0;
        for (const person of employees) {
            if (person.id > highestId) {
                highestId = person.id;
            }
        }
        return highestId + 1;
    }

    // Used by register.js: build the object, add it to the list and remember it.
    export function addEmployee(data) {
        const newEmployee = createEmployee(data);

        employees.push(newEmployee);
        refreshTeamSizes();
        saveRegisteredEmployee(newEmployee);

        return newEmployee;
    }

    // Replace the plain objects with Employee and Manager objects. splice()
    // changes the array in place, so module keeps using the same array.
    export function initEmployees() {
        const employeeObjects = employees.map(createEmployee);
        employees.splice(0, employees.length, ...employeeObjects);
        refreshTeamSizes();
    }

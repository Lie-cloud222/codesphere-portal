//  employees-export.js - lets ES6 modules import the employees array
//
// employee-data.js is a normal script, so it creates the global
// "employees" array for employees.js and register.js. A module such as
// departments.js cannot import from a normal script, so this tiny
// module re-exports the same array (no second copy of the data).
//
// It must be loaded AFTER employee-data.js (the HTML order does this).

const sharedEmployees = AppData.employees; // the global array from employee-data.js

export { sharedEmployees as employees };
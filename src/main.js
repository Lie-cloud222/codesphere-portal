// The entry point of the application

// Webpack starts here. It follows every import, joins all the modules into dist/bundle.js,
// and Babel rewrites the modern syntax for older browsers.
import { initEmployees } from "./classes";
import { initEmployeeDirectory } from "./employees";
import { initRemote } from "./remote";
import "../adaptive"; // menu toggle and touch detection (runs when loaded)

// Turn the plain data into Employee objects first, then start the page.
initEmployees();
initEmployeeDirectory();
initRemote();
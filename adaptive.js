// Hamburger menu: the button toggles the .active class on the <nav>
const menuToggle = document.getElementById("menu-toggle");
const mainNav = document.querySelector("nav");

// Only run if this page has both a button and a nav
if (menuToggle && mainNav) {
    // Tell screen readers the menu starts closed
    menuToggle.setAttribute("aria-expanded", "false");

    menuToggle.addEventListener("click", function () {
        // toggle() adds "active" if it is missing, remove it if present, and returns true when the menu is now open.
        const isOpen = mainNav.classList.toggle("active");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
}

// (hover: none) = the main input cannot hover (a finger, not a mouse)
// (pointer: coarse) = the main input is imprecise (a finger)
// The comma means "or": either condition counts as a touch device

const touchQuery = window.matchMedia("(hover: none), (pointer: coarse)");

// Add or remove a "touch-device" class on <body>. The CSS uses this class to make buttons (including the Exit buttons) larger and easier to tap
function applyTouchMode() {
    document.body.classList.toggle("touch-device", touchQuery.matches);
}

applyTouchMode(); // Check once when the page loads

// Re-check id the device changes 
touchQuery.addEventListener("change", applyTouchMode);
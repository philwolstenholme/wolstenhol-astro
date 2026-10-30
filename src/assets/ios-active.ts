// iOS Safari only applies :active while a touch is held if a touchstart
// listener exists somewhere in the tree. With the tap highlight turned off
// (global.css), :active is the press feedback, so register a no-op listener.
// Passive, so it never delays scrolling.
document.addEventListener("touchstart", () => {}, { passive: true });

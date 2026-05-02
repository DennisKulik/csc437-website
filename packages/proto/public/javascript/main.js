// access the element we are listening from
const darkModeHolder = document.getElementById("dark-mode-holder");

// add a listener to the element that listens for any change
darkModeHolder.addEventListener("change", function (event) {
    // if the event occurred at the right element
    if (event.target.id == "dark-mode-toggle") {
        // stop bubbling 
        event.stopPropagation();
        // call a useless relay function to spawn the event instead of just doing it here
        relayDarkModeToggle(event.currentTarget, event.target.checked);
    }
});

// listen on the body for our custom event 
document.body.addEventListener("darkmode:toggle", function (event) {
    const checked = event.detail.checked;

    if (checked) {
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
    }
});

function relayDarkModeToggle(target, checked) {
    // spawn in new custom event that bubbles and contains a property saying if the box was checked
    const customEvent = new CustomEvent("darkmode:toggle", {
        bubbles: true,
        detail: {checked}
    });

    target.dispatchEvent(customEvent);
}
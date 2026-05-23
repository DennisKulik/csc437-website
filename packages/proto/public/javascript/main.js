// listen on the body for our custom event 
document.body.addEventListener("darkmode:toggle", (event) => {
    const checked = event.detail.checked;

    if (checked) {
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
    }
});

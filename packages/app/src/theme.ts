export function initializeTheme() {
    const savedDarkMode = localStorage.getItem("dark-mode") === "true";
    document.body.classList.toggle("dark-mode", savedDarkMode);

    document.body.addEventListener("darkmode:toggle", (event: Event) => {
        const custom = event as CustomEvent<{ checked: boolean }>;
        const checked = custom.detail.checked;

        document.body.classList.toggle("dark-mode", checked);
        localStorage.setItem("dark-mode", String(checked));
    });
}

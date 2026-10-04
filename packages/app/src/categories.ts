export const categories = [
    { name: "Work", color: "#268bd2" },
    { name: "School", color: "#6c71c4" },
    { name: "Personal", color: "#859900" }
];

export function categoryColor(name?: string, color?: string): string {
    if (color && /^#[0-9a-f]{6}$/i.test(color)) return color;
    return categories.find((category) => category.name.toLowerCase() === name?.toLowerCase())?.color || "#2aa198";
}

export function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function profileFromRequest(body, userid) {
    if (!isRecord(body))
        return undefined;
    const { displayName, bio, profilePicture } = body;
    if (typeof displayName !== "string" ||
        !displayName.trim() ||
        displayName.trim().length > 80 ||
        (bio !== undefined && (typeof bio !== "string" || bio.length > 1000)) ||
        (profilePicture !== undefined && (typeof profilePicture !== "string" || profilePicture.length > 2048))) {
        return undefined;
    }
    return {
        userid,
        username: userid,
        displayName: displayName.trim(),
        bio: typeof bio === "string" ? bio.trim() : undefined,
        profilePicture: typeof profilePicture === "string"
            ? profilePicture.trim()
            : undefined
    };
}

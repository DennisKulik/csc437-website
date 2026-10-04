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
export function registrationFromRequest(body) {
    if (!isRecord(body))
        return undefined;
    const username = registrationUsername(body.username);
    const password = body.password;
    const profile = username ? profileFromRequest(body, username) : undefined;
    if (!username ||
        typeof password !== "string" ||
        password.length < 8 ||
        password.length > 128 ||
        !profile) {
        return undefined;
    }
    return { username, password, profile };
}
export function loginFromRequest(body) {
    if (!isRecord(body))
        return undefined;
    const username = typeof body.username === "string"
        ? body.username.trim()
        : "";
    const password = body.password;
    if (!username || typeof password !== "string" || !password)
        return undefined;
    return { username, password };
}
function registrationUsername(value) {
    if (typeof value !== "string")
        return undefined;
    const username = value.trim();
    if (username.length < 3 ||
        username.length > 50 ||
        !/^[A-Za-z0-9._-]+$/.test(username)) {
        return undefined;
    }
    return username;
}

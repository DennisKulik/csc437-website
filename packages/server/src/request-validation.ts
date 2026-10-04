import type { TaskDetails, UserProfile } from "./models/index.ts";

export type RegistrationData = {
    username: string;
    password: string;
    profile: UserProfile;
};

export type LoginData = {
    username: string;
    password: string;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function taskFromRequest(body: unknown): TaskDetails | undefined {
    if (!isRecord(body)) return undefined;
    const { title, description, notes, dueDate, category, categoryColor } = body;
    const optionalText = (value: unknown, limit: number) => value === undefined ||
        (typeof value === "string" && value.length <= limit);
    const clean = (value: unknown) => typeof value === "string" ? value.trim() || undefined : undefined;
    if (typeof title !== "string" || !title.trim() || title.length > 100 ||
        !optionalText(description, 1000) || !optionalText(notes, 1000) ||
        !optionalText(category, 50) ||
        !(dueDate === undefined || dueDate === "" || (typeof dueDate === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(dueDate) &&
            !Number.isNaN(new Date(`${dueDate}T00:00:00Z`).getTime()) &&
            new Date(`${dueDate}T00:00:00Z`).toISOString().slice(0, 10) === dueDate)) ||
        !(categoryColor === undefined || categoryColor === "" ||
            (typeof categoryColor === "string" && /^#[0-9a-f]{6}$/i.test(categoryColor)))
    ) return undefined;
    return {
        title: title.trim(), description: clean(description), notes: clean(notes),
        dueDate: clean(dueDate), category: clean(category), categoryColor: clean(categoryColor)
    };
}

export function profileFromRequest(
    body: unknown,
    userid: string
): UserProfile | undefined {
    if (!isRecord(body)) return undefined;

    const { displayName, bio, profilePicture } = body;

    if (
        typeof displayName !== "string" ||
        !displayName.trim() ||
        displayName.trim().length > 80 ||
        (bio !== undefined && (typeof bio !== "string" || bio.length > 1000)) ||
        (profilePicture !== undefined && (
            typeof profilePicture !== "string" || profilePicture.length > 2048
        ))
    ) {
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

export function registrationFromRequest(body: unknown): RegistrationData | undefined {
    if (!isRecord(body)) return undefined;

    const username = registrationUsername(body.username);
    const password = body.password;
    const profile = username ? profileFromRequest(body, username) : undefined;

    if (
        !username ||
        typeof password !== "string" ||
        password.length < 8 ||
        password.length > 128 ||
        !profile
    ) {
        return undefined;
    }

    return { username, password, profile };
}

export function loginFromRequest(body: unknown): LoginData | undefined {
    if (!isRecord(body)) return undefined;

    const username = typeof body.username === "string"
        ? body.username.trim()
        : "";
    const password = body.password;

    if (!username || typeof password !== "string" || !password) return undefined;
    return { username, password };
}

function registrationUsername(value: unknown): string | undefined {
    if (typeof value !== "string") return undefined;

    const username = value.trim();
    if (
        username.length < 3 ||
        username.length > 50 ||
        !/^[A-Za-z0-9._-]+$/.test(username)
    ) {
        return undefined;
    }

    return username;
}

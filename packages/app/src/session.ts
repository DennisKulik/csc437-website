const TOKEN_KEY = "un-auth:token";

type TokenPayload = {
    exp?: number;
    username?: string;
};

export function prepareStoredSession(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) return false;

    try {
        const payload = decodeTokenPayload(token);
        const hasIdentity = typeof payload.username === "string" && Boolean(payload.username);
        const hasValidExpiry = typeof payload.exp === "number" && payload.exp * 1000 > Date.now();

        if (hasIdentity && hasValidExpiry) return true;
    } catch {
        // A malformed token is handled the same way as an expired session.
    }

    localStorage.removeItem(TOKEN_KEY);
    return false;
}

export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    return fetch(input, init).then((response) => {
        if (response.status === 401) redirectToLogin();
        return response;
    });
}

export function getPostLoginRedirect(): string {
    const next = new URLSearchParams(window.location.search).get("next");

    if (!next) return "/app";

    try {
        const target = new URL(next, window.location.origin);

        const isApplicationRoute = target.pathname === "/app" || target.pathname.startsWith("/app/");

        if (target.origin === window.location.origin && isApplicationRoute) {
            return `${target.pathname}${target.search}${target.hash}`;
        }
    } catch {
        // Invalid redirect values fall back to the application home page.
    }

    return "/app";
}

export function getLoginPageHref(): string {
    const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const login = new URL("/login.html", window.location.origin);
    login.searchParams.set("next", next);
    return `${login.pathname}${login.search}`;
}

function redirectToLogin() {
    localStorage.removeItem(TOKEN_KEY);
    window.location.replace(getLoginPageHref());
}

function decodeTokenPayload(token: string): TokenPayload {
    const payload = token.split(".")[1];

    if (!payload) throw new Error("Invalid token");

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
        base64.length + ((4 - base64.length % 4) % 4),
        "="
    );

    return JSON.parse(atob(padded)) as TokenPayload;
}

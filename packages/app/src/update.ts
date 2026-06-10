import { Auth } from "@unbndl/auth";
import { Message } from "@unbndl/service";
import type { Events, Tasks, UserProfile } from "server/models";

import type { Model } from "./model.ts";
import type { Msg } from "./messages.ts";

type SaveCallbacks = {
    onSuccess?: () => void;
    onFailure?: (err: Error) => void;
};

export type Cmd =
    | ["tasks/load", { tasks: Tasks }]
    | ["events/load", { events: Events }]
    | ["user/load", { user: UserProfile }];

export default function update(
    model: Readonly<Model>,
    message: Msg | Cmd,
    auth: Auth.Model
): Model | Message.Async<Model, Cmd> {
    const [type, payload] = message;

    switch (type) {
        case "tasks/request":
            return [
                { ...model },
                requestTasks(auth)
            ];
        
        case "tasks/load":
            return {
                ...model,
                tasks: payload.tasks
            };

        case "events/request":
            if (model.events?.id === payload.weekid) {
                return { ...model }
            }

            return [
                {
                    ...model,
                    events: undefined,
                    currentWeekId: payload.weekid
                },
                requestEvents(payload.weekid, auth)
            ];
        
        case "events/load":
            return {
                ...model,
                events: payload.events,
                currentWeekId: payload.events.id
            };
            
        case "events/week-next": {
            const currentWeekId = model.currentWeekId || model.events?.id || getCurrentWeekId();
            const nextWeekId = shiftWeek(currentWeekId, 7);

            return [
                {
                    ...model,
                    events: undefined,
                    currentWeekId: nextWeekId
                },
                requestEvents(nextWeekId, auth)
            ];
        }

        case "events/week-prev": {
            const currentWeekId = model.currentWeekId || model.events?.id || getCurrentWeekId();
            const previousWeekId = shiftWeek(currentWeekId, -7);

            return [
                {
                    ...model,
                    events: undefined,
                    currentWeekId: previousWeekId
                },
                requestEvents(previousWeekId, auth)
            ];
        }

        case "user/request": {
            const userid = getUseridFromAuth(auth);

            if (!userid) {
                console.warn("Cannot request user profile: no authenticated userid");
                return { ...model };
            }

            if (model.user?.userid === userid) {
                return { ...model };
            }

            return [
                { ...model },
                requestUser(userid, auth)
            ];
        }

        case "user/save": {
            return [
                { ...model },
                saveUser(payload.userid, payload.user, auth)
                    .then((cmd) => {
                        const callbacks = message[2];
                        callbacks?.onSuccess?.();
                        return cmd;
                    })
                    .catch((err: Error) => {
                        const callbacks = message[2];
                        callbacks?.onFailure?.(err);
                        throw err;
                    })
            ];
        }

        case "user/load":
            return {
                ...model,
                user: payload.user
            };
        
        // case "task/select":
        // case "event/select":

        default: 
            const unhandled: never = type;
            throw new Error(`Unhandled message "${unhandled}"`);    
        }
}

function requestTasks(auth: Auth.Model): Promise<Cmd> {
    return fetch("/api/tasks", {
        headers: authorization(auth)
    })
        .then((res) => {
            if (!res.ok) throw new Error(`Tasks request failed: ${res.status}`);
            return res.json();
        })
        .then((tasks: Tasks) => ["tasks/load", { tasks }]);
}

function requestEvents(weekid: string, auth: Auth.Model): Promise<Cmd> {
    return fetch(`/api/events/${weekid}`, {
        headers: authorization(auth)
    })
        .then((res) => {
            if (res.status === 404) {
                return emptyEvents(weekid);
            }

            if (!res.ok) {
                throw new Error(`Events request failed: ${res.status}`);
            }
            return res.json();
        })
        .then((events: Events) => ["events/load", { events }]);
}

function requestUser(userid: string, auth: Auth.Model): Promise<Cmd> {
    return fetch(`/api/users/${userid}`, {
        headers: authorization(auth)
    })
        .then((res) => {
            if (!res.ok) throw new Error(`User request failed: ${res.status}`);
            return res.json();
        })
        .then((user: UserProfile) => ["user/load", { user }]);
}

function authorization(auth: Auth.Model): HeadersInit {
    if (auth.authenticated) {
        const authenticatedUser = auth as Auth.AuthenticatedUser;
        return {
            Authorization: `Bearer ${authenticatedUser.token}`
        };
    }

    return {};
}


function getUseridFromAuth(auth: Auth.Model): string | undefined {
    if (!auth.authenticated) return undefined;

    const authenticatedUser = auth as Auth.AuthenticatedUser;
    const token = authenticatedUser.token;

    if (!token) return undefined;    
    const payload = decodeJwtPayload(token);

    return payload.username;
}

function decodeJwtPayload(token: string): { username?: string } {
    const [, payload] = token.split(".");

    if (!payload) return {};

    const base64 = payload
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const padded = base64.padEnd(
        base64.length + ((4 - base64.length % 4) % 4),
        "="
    );

    return JSON.parse(atob(padded));
}

function saveUser(
    userid: string,
    user: UserProfile,
    auth: Auth.Model
): Promise<Cmd> {
    return fetch(`/api/users/${userid}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...authorization(auth)
        },
        body: JSON.stringify(user)
    })
        .then((res) => {
            if (!res.ok) throw new Error(`User save failed: ${res.status}`);
            return res.json();
        })
        .then((user: UserProfile) => ["user/load", { user }]);
}

function shiftWeek(weekid: string, days: number): string {
    const current = new Date(`${weekid}T00:00:00`);
    current.setDate(current.getDate() + days);
    return toWeekId(current);
}

function getCurrentWeekId(): string {
    const today = new Date();
    const day = today.getDay();
    today.setDate(today.getDate() - day);
    return toWeekId(today);
}

function toWeekId(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function emptyEvents(weekid: string): Events {
    return {
        id: weekid,
        userid: "",
        week: new Date(`${weekid}T00:00:00`),
        weekdays: []
    };
}
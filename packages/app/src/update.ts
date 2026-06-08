import { Auth } from "@unbndl/auth";
import { Message } from "@unbndl/service";
import type { Events, Tasks } from "server/models";

import type { Model } from "./model.ts";
import type { Msg } from "./messages.ts";

export type Cmd =
    | ["tasks/load", { tasks: Tasks }]
    | ["events/load", { events: Events }];

export default function update(
    model: Readonly<Model>,
    message: Msg | Cmd,
    user: Auth.User
): Model | Message.Async<Model, Msg | Cmd> {
    const [type, payload] = message;

    switch (type) {
        case "tasks/request":
            return [
                { ...model },
                requestTasks(user)
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
                { ...model,
                    currentWeekId: payload.weekid
                },
                requestEvents(payload.weekid, user)
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
                    currentWeekId: nextWeekId
                },
                requestEvents(nextWeekId, user)
            ];
        }

        case "events/week-prev": {
            const currentWeekId = model.currentWeekId || model.events?.id || getCurrentWeekId();
            const previousWeekId = shiftWeek(currentWeekId, -7);

            return [
                {
                    ...model,
                    currentWeekId: previousWeekId
                },
                requestEvents(previousWeekId, user)
            ];
        }

        // case "task/select":
        // case "event/select":

        default: 
            throw new Error(`Unhandled message "${type}"`);
    }
}

function requestTasks(user: Auth.User): Promise<Cmd> {
    return fetch("/api/tasks", {
        headers: authorization(user)
    })
        .then((res) => {
            if (!res.ok) throw new Error(`Tasks request failed: ${res.status}`);
            return res.json();
        })
        .then((tasks: Tasks) => ["tasks/load", { tasks }]);
}

function requestEvents(weekid: string, user: Auth.User): Promise<Cmd> {
    return fetch(`/api/events/${weekid}`, {
        headers: authorization(user)
    })
        .then((res) => {
            if (!res.ok) throw new Error(`Events request failed: ${res.status}`);
            return res.json();
        })
        .then((events: Events) => ["events/load", { events }]);
}

function authorization(user: Auth.User): HeadersInit {
    if (user.authenticated) {
        const authenticatedUser = user as Auth.AuthenticatedUser;
        
        return {
            Authorization: `Bearer ${authenticatedUser.token}`
        };
    }

    return {};
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

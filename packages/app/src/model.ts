import type { Events, Tasks, UserProfile } from "server/models";

export type LoadStatus = "idle" | "loading" | "ready" | "error";

export interface Model {
    events?: Events;
    eventsStatus: LoadStatus;
    eventsError?: string;
    tasks?: Tasks;
    user?: UserProfile;
    userStatus: LoadStatus;
    userError?: string;
    currentWeekId?: string;
}

export const init: Model = {
    eventsStatus: "idle",
    userStatus: "idle"
};

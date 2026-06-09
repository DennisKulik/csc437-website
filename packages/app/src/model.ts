import type { Events, Tasks, UserProfile } from "server/models";

export interface Model {
    events?: Events;
    tasks?: Tasks;
    user?: UserProfile;
    currentWeekId?: string;
}

export const init: Model = {};

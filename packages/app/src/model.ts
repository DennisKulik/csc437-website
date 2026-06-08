import type { Events, Tasks } from "server/models";

export interface Model {
    events?: Events;
    tasks?: Tasks;
    currentWeekId?: string;
}

export const init: Model = {};

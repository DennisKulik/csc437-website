import { Event, Events } from "../models";
declare function get(id: string, userid: string): Promise<Events | undefined>;
declare function addEvent(id: string, day: string, recurring: boolean, event: Event, userid: string): Promise<Events>;
declare function updateEvent(id: string, eventid: string, replacement: Event, userid: string): Promise<Events | undefined>;
declare function removeEvent(id: string, eventid: string, userid: string): Promise<Events | undefined>;
declare const _default: {
    get: typeof get;
    addEvent: typeof addEvent;
    updateEvent: typeof updateEvent;
    removeEvent: typeof removeEvent;
};
export default _default;

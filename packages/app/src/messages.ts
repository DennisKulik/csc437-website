import type { Event, Events, Tasks, UserProfile } from "server/models";

type SaveCallbacks = {
    onSuccess?: () => void;
    onFailure?: (err: Error) => void;
};

export type Msg =
    | ["tasks/request", {}]
    | ["tasks/load", { tasks: Tasks }]
    | ["events/request", { weekid: string }]
    | ["events/load", { events: Events }]
    | [
        "events/create",
        {
            weekid: string;
            day: string;
            recurring: boolean;
            event: Event;
        },
        SaveCallbacks
    ]
    | [
        "events/update",
        {
            weekid: string;
            eventid: string;
            event: Event;
        },
        SaveCallbacks
    ]
    | [
        "events/delete",
        {
            weekid: string;
            eventid: string;
        },
        SaveCallbacks
    ]
    | ["events/week-next", {}]
    | ["events/week-prev", {}]
    | ["events/week-current", {}]
    | ["user/request", {}]
    | ["user/load", { user: UserProfile }]
    | [
        "user/save",
        {
            userid: string;
            user: UserProfile;
        },
        {
            onSuccess?: () => void;
            onFailure?: (err: Error) => void;
        }
    ]
    // | ["task/select", { taskid: string }]
    // | ["event/select", { eventid: string }];

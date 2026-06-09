import type { Events, Tasks, UserProfile } from "server/models";

export type Msg =
    | ["tasks/request", {}]
    | ["tasks/load", { tasks: Tasks }]
    | ["events/request", { weekid: string }]
    | ["events/load", { events: Events }]
    | ["events/week-next", {}]
    | ["events/week-prev", {}]
    | ["user/request", {}]
    | ["user/load", { user: UserProfile }]
    | ["task/select", { taskid: string }]
    | ["event/select", { eventid: string }];
    
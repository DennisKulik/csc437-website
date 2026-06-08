import type { Events, Tasks } from "server/models";

export type Msg =
    | ["tasks/request", {}]
    | ["tasks/load", { tasks: Tasks }]
    | ["events/request", { weekid: string }]
    | ["events/load", { events: Events }]
    | ["events/week-next", {}]
    | ["events/week-prev", {}]
    | ["task/select", { taskid: string }]
    | ["event/select", { eventid: string }];
    
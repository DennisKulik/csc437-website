export interface Events {
    id: string;
    week: Date;
    weekdays: Array<Weekday>;
}

export interface Weekday {
    day: string;
    oneTimeEvents: Array<Event>;
    recurringEvents: Array<Event>;
}

export interface Event {
    title: string;
    href: string;
}

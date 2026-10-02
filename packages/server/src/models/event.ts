export interface Events {
    id: string;
    userid: string;
    week: Date;
    weekdays: Array<Weekday>;
}

export interface Weekday {
    day: string;
    oneTimeEvents: Array<Event>;
    recurringEvents: Array<Event>;
}

export interface Event {
    id?: string;
    title: string;
    href?: string;
    category?: string;
    date?: string;
    time?: string;
    location?: string;
    description?: string;
    notes?: string;
}

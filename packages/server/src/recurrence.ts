import type { Events } from "./models/index.ts";

export const weekdays = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

export function dateForDay(weekid: string, day: string): string {
    const date = new Date(`${weekid}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + weekdays.indexOf(day));
    return date.toISOString().slice(0, 10);
}

export function expandWeeklyEvents(
    weekid: string,
    userid: string,
    storedWeek: Events | undefined,
    sourceWeeks: Events[]
): Events | undefined {
    const result: Events = {
        id: weekid,
        userid,
        week: new Date(`${weekid}T00:00:00Z`),
        weekdays: (storedWeek?.weekdays || []).map((weekday) => ({
            day: weekday.day,
            oneTimeEvents: weekday.oneTimeEvents.map((event) => ({ ...event })),
            recurringEvents: weekday.recurringEvents
                .filter((event) => !event.recurrenceStart)
                .map((event) => ({ ...event }))
        }))
    };
    let hasOccurrences = false;

    for (const source of sourceWeeks) {
        if (source.userid !== userid) continue;
        for (const weekday of source.weekdays) {
            if (!weekdays.includes(weekday.day)) continue;
            const occurrenceDate = dateForDay(weekid, weekday.day);
            for (const event of weekday.recurringEvents) {
                if (!event.id || !event.recurrenceStart || occurrenceDate < event.recurrenceStart) continue;
                let target = result.weekdays.find((candidate) => candidate.day === weekday.day);
                if (!target) {
                    target = { day: weekday.day, oneTimeEvents: [], recurringEvents: [] };
                    result.weekdays.push(target);
                }
                target.recurringEvents.push({ ...event, date: occurrenceDate });
                hasOccurrences = true;
            }
        }
    }

    return storedWeek || hasOccurrences ? result : undefined;
}

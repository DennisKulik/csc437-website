import { css, html, shadow, type Template } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";

import type { Model } from "../model.ts";
import reset from "../styles/reset.css.ts";
import page from "../styles/page.css.ts";
import card from "../styles/card.css.ts";

type EventSummary = {
    title: string;
    day: string;
};

type WeekdayEvents = {
    day: string;
    oneTimeEvents?: Array<{ title: string }>;
    recurringEvents?: Array<{ title: string }>;
};

export class EventViewElement extends HTMLElement {
    viewModel = createViewModel<Model>({})
        .with(fromStore<Model>(this), "events", "currentWeekId");

    view: Template<[Model]> = html`
            <main class="page">
                <div class="event-layout">
                    <aside class="event-list card border-small" aria-label="Events">
                        <div class="list-header">
                            <p class="eyebrow">${($) => `Week of ${this.formatWeek($.currentWeekId || $.events?.id)}`}</p>
                            <h2>Events</h2>
                        </div>

                        <ul class="event-groups">
                            ${($) => {
                                const events = this.getEventList($.events);
                                const selectedTitle = this.getSelectedTitle(events);

                                const weekid = $.currentWeekId || $.events?.id || EventViewElement.getCurrentWeekId();

                                return events.length
                                    ? this.groupEventsByDay(events).map((group) =>
                                        this.renderEventGroup(group.day, group.events, selectedTitle, weekid)
                                    )
                                    : html`<li class="empty-list">No events this week.</li>`;
                            }}
                        </ul>
                    </aside>

                    <article class="event-detail card border-small">
                        <header class="detail-header">
                            <div>
                                <p class="eyebrow">Event</p>
                                <h1>${($) => this.getSelectedTitle(this.getEventList($.events))}</h1>
                            </div>
                            <p class="status">Upcoming</p>
                        </header>

                        <div class="detail-meta">
                            <dl>
                                <div><dt>Category</dt><dd>Personal</dd></div>
                                <div><dt>Date</dt><dd>April 7, 2026</dd></div>
                                <div><dt>Time</dt><dd>6:00 PM</dd></div>
                                <div><dt>Location</dt><dd>Grover Beach</dd></div>
                            </dl>
                            <img src="/images/bonfire.jpg" alt="Bonfire at the beach" />
                        </div>

                        <section>
                            <h2>Description</h2>
                            <p>There will be a big bonfire to celebrate Brandon's 22nd birthday!</p>
                        </section>

                        <section>
                            <h2>Notes</h2>
                            <p>Bring warm clothes, beach chairs, and anything needed for the bonfire.</p>
                        </section>
                    </article>
                </div>
            </main>
    `;

    constructor() {
        super();
        shadow(this)
            .styles(reset.styles, page.styles, card.styles, EventViewElement.styles)
            .replace(this.viewModel.render(this.view));
    }

    connectedCallback() {
        const $ = this.viewModel.toObject();

        const weekid = this.getRequestedWeekId() || $.currentWeekId || EventViewElement.getCurrentWeekId();

        if ($.events?.id !== weekid) {
            Store.dispatch(this, ["events/request", {
                weekid
            }]);
        }
    }

    getEventList(events: Model["events"]): EventSummary[] {
        const weekdays = (events?.weekdays || []) as WeekdayEvents[];

        return weekdays.flatMap((weekday) => {
            const day = weekday.day;
            const oneTimeEvents = weekday.oneTimeEvents || [];
            const recurringEvents = weekday.recurringEvents || [];

            return [...oneTimeEvents, ...recurringEvents].map((event) => ({
                title: event.title,
                day
            }));
        });
    }

    getSelectedTitle(events: EventSummary[]): string {
        const requestedTitle = new URLSearchParams(window.location.search).get("event");

        return requestedTitle || events[0]?.title || "Event details";
    }

    getRequestedWeekId(): string | null {
        return new URLSearchParams(window.location.search).get("week");
    }

    formatWeek(weekid: string | undefined): string {
        return weekid || "selected week";
    }

    groupEventsByDay(events: EventSummary[]): Array<{ day: string; events: EventSummary[] }> {
        const groups = new Map<string, EventSummary[]>();

        events.forEach((event) => {
            const eventsForDay = groups.get(event.day) || [];
            eventsForDay.push(event);
            groups.set(event.day, eventsForDay);
        });

        return Array.from(groups, ([day, events]) => ({ day, events }));
    }

    renderEventGroup(
        day: string,
        events: EventSummary[],
        selectedTitle: string,
        weekid: string
    ) {
        return html`
            <li class="day-group">
                <h3>${day}</h3>
                <ul class="day-events">
                    ${events.map((event) => this.renderEventListItem(event, selectedTitle, weekid))}
                </ul>
            </li>
        `;
    }

    renderEventListItem(event: EventSummary, selectedTitle: string, weekid: string) {
        const isSelected = event.title === selectedTitle;
        const eventHref = `/app/event?event=${encodeURIComponent(event.title)}&week=${encodeURIComponent(weekid)}`;

        if (isSelected) {
            return html`
                <li>
                    <a class="event-list-item selected" href=${eventHref} aria-current="page">
                        <span>${event.title}</span>
                        <small>${event.day}</small>
                    </a>
                </li>
            `;
        }

        return html`
            <li>
                <a class="event-list-item" href=${eventHref}>
                    <span>${event.title}</span>
                    <small>${event.day}</small>
                </a>
            </li>
        `;
    }

    static getCurrentWeekId(): string {
        const today = new Date();
        today.setDate(today.getDate() - today.getDay());
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    static styles = css`
        .page {
            display: grid;
            grid-template-columns: repeat(8, minmax(0, 1fr));
        }

        .event-layout {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: minmax(220px, 2fr) minmax(0, 5fr);
            gap: var(--padding-standard);
            margin: var(--padding-standard) 0;
        }

        .event-list,
        .event-detail {
            padding: var(--padding-standard);
            background-color: var(--color-secondary);
            color: var(--text-primary);
        }

        .list-header,
        .detail-header {
            border-bottom: 2px solid var(--color-accent-dark);
            padding-bottom: var(--padding-small);
        }

        .eyebrow {
            margin: 0 0 var(--padding-tiny);
            color: var(--text-primary);
            font-size: 15px;
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }

        h1,
        h2,
        h3,
        p {
            margin-top: 0;
        }

        h1,
        h2 {
            color: var(--text-primary);
        }

        h1 {
            margin-bottom: 0;
            font-size: clamp(32px, 4vw, 48px);
        }

        .event-list h2 {
            margin-bottom: 0;
            font-size: 32px;
        }

        .event-groups,
        .day-events {
            display: flex;
            flex-direction: column;
            gap: var(--padding-mini);
            padding: 0;
            list-style: none;
        }

        .event-groups {
            margin: var(--padding-standard) 0 0;
        }

        .day-group + .day-group {
            padding-top: var(--padding-standard);
            border-top: 1px solid var(--color-accent-dark);
        }

        .day-group h3 {
            margin: 0 0 var(--padding-mini);
            color: var(--text-primary);
            font-size: 20px;
        }

        .event-list-item {
            display: block;
            width: 100%;
            padding: var(--padding-small);
            border: 2px solid transparent;
            border-radius: var(--padding-mini);
            color: var(--text-primary);
            background: transparent;
            font: inherit;
            text-align: left;
            text-decoration: none;
            cursor: pointer;
        }

        .event-list-item:hover {
            background-color: var(--color-primary);
        }

        .event-list-item.selected {
            border-color: var(--color-accent-dark);
            background-color: var(--color-primary);
            font-weight: 700;
        }

        .event-list-item span,
        .event-list-item small {
            display: block;
        }

        .event-list-item small {
            margin-top: var(--padding-tiny);
            font-weight: 400;
        }

        .empty-list {
            color: var(--text-primary);
        }

        .detail-header {
            display: flex;
            justify-content: space-between;
            gap: var(--padding-small);
            align-items: flex-start;
        }

        .status {
            margin: 0;
            padding: var(--padding-mini) var(--padding-small);
            border-radius: var(--padding-small);
            background-color: var(--color-primary);
            font-weight: 600;
        }

        .detail-meta {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(180px, 1fr);
            gap: var(--padding-standard);
            margin: var(--padding-standard) 0;
        }

        dl {
            display: grid;
            gap: var(--padding-small);
            margin: 0;
        }

        dt {
            font-weight: 700;
        }

        dd {
            margin: var(--padding-tiny) 0 0;
        }

        img {
            width: 100%;
            height: 100%;
            min-height: 180px;
            border-radius: var(--padding-mini);
            object-fit: cover;
        }

        section + section {
            margin-top: var(--padding-standard);
        }

        section h2 {
            margin-bottom: var(--padding-mini);
            font-size: 26px;
        }

        section p {
            margin-bottom: 0;
            line-height: 1.4;
        }

        @media (max-width: 1100px) {
            .event-layout {
                grid-column: 1 / -1;
                margin: var(--padding-standard) 0;
            }
        }

        @media (max-width: 700px) {
            .event-layout {
                grid-template-columns: 1fr;
                gap: var(--padding-small);
                margin: var(--padding-small) 0;
            }

            .event-list,
            .event-detail {
                padding: var(--padding-small);
            }

            .detail-meta {
                grid-template-columns: 1fr;
            }

            img {
                max-height: 240px;
            }
        }
    `;
}

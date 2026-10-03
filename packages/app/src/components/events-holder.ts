import { html, css, shadow, type Template } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";

import type { Model } from "../model.ts";
import reset from "../styles/reset.css.js";
import button from "../styles/button.css.ts";

type EventCard = {
    id?: string;
    title: string;
    href: string;
};

type Weekday = {
    day: string;
    oneTimeEvents: EventCard[];
    recurringEvents: EventCard[];
};

export class MomentumEventsHolder extends HTMLElement {
    static weekdays = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];

    viewModel = createViewModel<Model>({
        eventsStatus: "idle",
        userStatus: "idle"
    })
        .with(
            fromStore<Model>(this),
            "events",
            "eventsStatus",
            "eventsError",
            "currentWeekId"
        );

    view: Template<[Model]> = html`
        <div class="events-holder">
            <div class="section-header">
                <h2>Events</h2>
                <div class="week-controls">
                    <button type="button" class="button hover-lift prev-week-button">Prev</button>
                    <span class="section-meta">
                        ${($) =>
                            MomentumEventsHolder.formatWeek(
                                $.currentWeekId || $.events?.id || MomentumEventsHolder.getCurrentWeekId()
                            )}
                    </span>
                    <button type="button" class="button hover-lift next-week-button">Next</button>
                </div>
            </div>

            <div class="weekday-list">
                ${($) => this.renderWeekState($)}
            </div>
        </div>
    `;

    constructor() {
        super();
        shadow(this)
            .styles(reset.styles, button.styles, MomentumEventsHolder.styles)
            .replace(this.viewModel.render(this.view))
            .delegate(".prev-week-button", {
                click: () => Store.dispatch(this, ["events/week-prev", {}])
            })
            .delegate(".next-week-button", {
                click: () => Store.dispatch(this, ["events/week-next", {}])
            })
            .delegate(".retry-events-button", {
                click: () => this.requestCurrentWeek()
            });
    }

    connectedCallback() {
        const $ = this.viewModel.toObject();
        const requestedWeekId = new URLSearchParams(window.location.search).get("week");
        const weekid = requestedWeekId || $.currentWeekId || $.events?.id || MomentumEventsHolder.getCurrentWeekId();
        if ($.events?.id !== weekid) {
            Store.dispatch(this, ["events/request", { weekid }]);
        }
    }

    requestCurrentWeek() {
        const $ = this.viewModel.toObject();
        const weekid = $.currentWeekId || $.events?.id || MomentumEventsHolder.getCurrentWeekId();
        Store.dispatch(this, ["events/request", { weekid }]);
    }

    renderWeekState(model: Model) {
        if (model.eventsStatus === "idle" || model.eventsStatus === "loading") {
            return html`
                <div class="week-state" role="status" aria-live="polite">
                    Loading this week...
                </div>
            `;
        }

        if (model.eventsStatus === "error") {
            return html`
                <div class="week-state week-error" role="alert">
                    <p>${model.eventsError || "This week could not be loaded."}</p>
                    <button type="button" class="button hover-lift retry-events-button">
                        Try Again
                    </button>
                </div>
            `;
        }

        const weekid = model.currentWeekId || model.events?.id || MomentumEventsHolder.getCurrentWeekId();
        const weekdays = MomentumEventsHolder.getWeekdays(model.events?.weekdays as Weekday[] | undefined);
        const eventCount = weekdays.reduce(
            (total, weekday) => total + weekday.oneTimeEvents.length + weekday.recurringEvents.length,
            0
        );

        return html`
            ${eventCount === 0 ? html`
                <p class="empty-week" role="status">
                    Nothing is scheduled for this week yet. Add an event to any day below.
                </p>
            ` : ""}
            ${weekdays.map((weekday) => MomentumEventsHolder.renderWeekday(weekday, weekid))}
        `;
    }

    static getCurrentWeekId(): string {
        const today = new Date();
        const day = today.getDay();
        today.setDate(today.getDate() - day);
        return this.toWeekId(today);
    }

    static toWeekId(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    static formatWeek(week: string): string {
        return week.slice(0, 10);
    }

    static renderEvent(event: EventCard, slotName: string, weekid: string) {
        const { title } = event;
        const eventKey = event.id || title;
        const eventHref = `/app/event?event=${encodeURIComponent(eventKey)}&week=${encodeURIComponent(weekid)}`;

        return html`
            <li slot=${slotName}>
                <momentum-event-card href=${eventHref}>
                    ${title}
                </momentum-event-card>
            </li>
        `;
    }
    
    static getWeekdays(weekdays: Weekday[] | undefined): Weekday[] {
        const weekdaysByName = new Map(
            (weekdays || []).map((weekday: Weekday) => [weekday.day, weekday])
        );

        return this.weekdays.map((day) => {
            const weekday = weekdaysByName.get(day);

            return {
                day,
                oneTimeEvents: weekday?.oneTimeEvents || [],
                recurringEvents: weekday?.recurringEvents || []
            };
        });
    }

    static renderWeekday(weekday: Weekday, weekid: string) {
        const day = weekday.day;
        const oneTimeEvents = weekday.oneTimeEvents || [];
        const recurringEvents = weekday.recurringEvents || [];

        return html`
            <momentum-weekday-section day=${day} week=${weekid}>
                <span slot="day">${day}</span>

                ${oneTimeEvents.map((event) => this.renderEvent(event, "one-time-events", weekid))}
                ${recurringEvents.map((event) => this.renderEvent(event, "recurring-events", weekid))}
            </momentum-weekday-section>
        `;
    }
    
    static styles = css`
        :host {
            grid-column: start / end;
        }
        
        @media (max-width: 1100px) {
            :host {
                grid-column: start / end;
            }
        }
        
        .events-holder {
            background-color: var(--color-primary);
            padding: var(--padding-standard);
            margin: var(--padding-standard);
            border-radius: var(--padding-small);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

            display: flex;
            flex-direction: column;
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            border-bottom: 5px solid var(--color-accent-dark);
            margin-bottom: var(--padding-small);
        }

        .section-header h2 {
            color: var(--text-primary);
        }

        .section-meta {
            color: var(--text-primary);
        }

        .weekday-list {
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            
            gap: var(--padding-small);
        }

        .week-state,
        .empty-week {
            padding: var(--padding-standard);
            border-radius: var(--padding-mini);
            color: var(--text-primary);
            background-color: var(--color-secondary);
            text-align: center;
        }

        .week-state p,
        .empty-week {
            margin: 0;
        }

        .week-error .button {
            margin-top: var(--padding-small);
        }
    `;
}

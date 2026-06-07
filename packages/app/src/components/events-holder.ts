import { html, css, shadow, type Template } from "@unbndl/html";
import { createViewModel, fromAttributes } from "@unbndl/view";
import { fromAuth } from "@unbndl/auth";
import reset from "../styles/reset.css.js";
import button from "../styles/button.css.ts";

type EventCard = {
    title: string;
    href: string;
};

type Weekday = {
    day: string;
    oneTimeEvents: EventCard[];
    recurringEvents: EventCard[];
};

type EventsHolderViewModel = {
    src?: string;
    authenticated: boolean;
    token?: string;
    currentWeekId: string;
    week: string;
    weekdays: Weekday[];
};

type EventsHolderAttributes = {
    src?: string;
};

export class MomentumEventsHolder extends HTMLElement {

    viewModel = createViewModel<EventsHolderViewModel>({
        authenticated: false,
        token: undefined,
        currentWeekId: MomentumEventsHolder.getCurrentWeekId(),
        week: "",
        weekdays: []
    })
    .with(fromAttributes<EventsHolderAttributes>(this), "src")
    .with(fromAuth(this), "authenticated", "token");

    view: Template<[EventsHolderViewModel]> = html`
        <div class="events-holder">
            <div class="section-header">
                <h2>Events</h2>
                <div class="week-controls">
                    <button type="button" class="button hover-lift">Prev</button>
                    <span class="section-meta">
                        ${($) => MomentumEventsHolder.formatWeek($.week || $.currentWeekId)}
                    </span>
                    <button type="button" class="button hover-lift">Next</button>
                </div>
            </div>

            <div class="weekday-list">
                ${($) => ($.weekdays || []).map((weekday) => MomentumEventsHolder.renderWeekday(weekday))}
            </div>
        </div>
        `;

    constructor() {
        super();
        shadow(this)
            .styles(reset.styles, button.styles, MomentumEventsHolder.styles)
            .replace(this.viewModel.render(this.view))
            .delegate(".prev-week-button", {
                click: () => this.shiftWeek(-7)
            })
            .delegate(".next-week-button", {
                click: () => this.shiftWeek(7)
            });

        this.viewModel.createEffect(($) => {
            if ($.authenticated && $.currentWeekId) {
                this.hydrate(`/api/events/${$.currentWeekId}`).then((data) => {
                    this.viewModel.set("week", data?.week || $.currentWeekId);
                    this.viewModel.set("weekdays", data?.weekdays || []);
                });
            }
        });
    }

    get authorization(): HeadersInit {
        const $ = this.viewModel.toObject();
        if ($.authenticated) {
            return { Authorization: `Bearer ${$.token}` };
        } else {
            return {};
        }
    }

    shiftWeek(days: number) {
        const $ = this.viewModel.toObject();
        const current = new Date(`${$.currentWeekId}T00:00:00`);
        current.setDate(current.getDate() + days);
        this.viewModel.set("currentWeekId", MomentumEventsHolder.toWeekId(current));
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

    static renderEvent(event: EventCard, slotName: string) {
        const { title, href } = event;

        return html`
            <li slot=${slotName}>
                <momentum-event-card href=${href}>
                    ${title}
                </momentum-event-card>
            </li>
        `;
    }
    
    static renderWeekday(weekday: Weekday) {
        const day = weekday.day;
        const oneTimeEvents = weekday?.oneTimeEvents || [];
        const recurringEvents = weekday?.recurringEvents || [];

        return html`
            <momentum-weekday-section>
                <span slot="day">${day}</span>

                ${oneTimeEvents.map((event) => this.renderEvent(event, "one-time-events"))}
                ${recurringEvents.map((event) => this.renderEvent(event, "recurring-events"))}
            </momentum-weekday-section>
        `;
    }
    

    hydrate(src: string) {
        return fetch(src, { headers: this.authorization })
        .then((response) => {
            if (response.status !== 200) 
                throw `HTTP Status ${response.status}`;
            else {
                return response.json();
            }
        })
        .catch((error) => {
            console.log(`Could not fetch ${src}:`, error);
        });
    }

    static styles = css`
        :host {
            grid-column: 4 / end;
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
    `;
}
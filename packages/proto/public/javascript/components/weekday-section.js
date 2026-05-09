import { html, css, shadow } from "@unbndl/html"
import reset from "/styles/reset.css.js"

export class MomentumWeekdaySection extends HTMLElement {

    static template = html`
        <template>
            <div class="weekday-section">
                <div class="event-card-header">
                    <h3><slot name="day">Day</slot></h3>
                    <span class="section-meta">
                        <button type="button" class="button hover-lift">Add Event</button>
                    </span>
                </div>

                <div class="event-list-container">
                    <div class="one-time-events">
                        <h4>One Time Events</h4>
                        <ul class="event-list">
                            <slot name="one-time-events"></slot>
                        </ul>
                    </div>
                    <div class="recurring-events">
                        <h4>Recurring Events</h4>
                        <ul class="event-list">
                            <slot name="recurring-events"></slot>
                        </ul>
                    </div>
                </div>
            </div>
        </template>
    `;

    constructor() {
        super();
        shadow(this)
            .template(MomentumWeekdaySection.template)
            .styles(reset.styles, MomentumWeekdaySection.styles)

    }

    static styles = css`
        .weekday-section {
            background-color: var(--color-secondary);
            display: flex;
            flex-direction: column;
            gap: var(--padding-small);

            padding: var(--padding-small);
            border-radius: var(--padding-mini);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .event-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid var(--color-accent-dark);

        }

        .event-card-header h3 {
            color: var(--text-primary);
        }

        .section-meta {
            color: var(--text-primary);
        }

        .button {
            padding: var(--padding-mini);
            margin: 0 var(--padding-tiny) var(--padding-mini);
            border-radius: var(--padding-standard);
            background-color: var(--color-accent-dark);
            color: var(--text-secondary);
            font-family: var(--font-primary);
            font-size: 16px;
            font-weight: 600;
        }

        .hover-lift {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .hover-lift:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .event-list-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
        }

        .one-time-events {
            border-right: 3px solid var(--color-primary);
            padding-right: var(--padding-small);
        }

        .recurring-events {
            padding-left: var(--padding-small);
        }

        ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        ::slotted(li) {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        @media (max-width: 700px) {
            .event-list-container {
                grid-template-columns: 1fr;
            }
            
            .one-time-events {
                border-right: none;
                border-bottom: 3px solid var(--color-primary);
                padding-right: 0;
                padding-bottom: var(--padding-small);
                margin-bottom: var(--padding-small);
            }
            
            .recurring-events {
                padding-left: 0;
            }
        }
    `;
}
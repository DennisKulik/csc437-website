import { html, css, shadow } from "@unbndl/html"
import reset from "/styles/reset.css.js"

export class MomentumEventCard extends HTMLElement {

    static template = html`
        <template>
            <a class="card event-card hover-lift card-layout">
                <slot>Event Name</slot>
            </a>
        </template>
    `;

    static observedAttributes = ["href"];

    constructor() {
        super();
        shadow(this)
            .template(MomentumEventCard.template)
            .styles(reset.styles, MomentumEventCard.styles)
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "href") {
            const link = this.shadowRoot.querySelector("a");

            if (link) {
                link.href = newValue;
            }
        }
    }

    static styles = css`
        .card {
            border-radius: var(--padding-mini);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .card-layout {
            display: grid;
            grid-template-columns: auto 1fr auto;
            align-items: center;
            gap: var(--padding-small);
            padding: var(--padding-small);
        }

        .event-card {
            background-color: var(--color-tertiary);
        }

        a {
            color: var(--text-secondary);
            text-decoration: none;
            font-weight: 500;
        }

        .hover-lift {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .hover-lift:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        :host([disabled]) a {
            pointer-events: none;
            cursor: default;
            opacity: 0.9;
        }
    `;
}
import { html, css, shadow } from "@unbndl/html";
import reset from "/styles/reset.css.js";

export class MomentumTaskCard extends HTMLElement {

    static template = html`
        <template>
            <a class="card task-tile hover-lift card-layout">
                Untitled Task
            </a>
        </template>
    `;

    static observedAttributes = ["href", "title"];

    constructor() {
        super();
        shadow(this)
            .template(MomentumTaskCard.template)
            .styles(reset.styles, MomentumTaskCard.styles);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        const link = this.shadowRoot.querySelector("a");

        if (!link) return;

        if (name === "href") {
            link.href = newValue || "";
        }

        if (name === "title") {
            link.textContent = newValue || "Untitled Task";
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

        .task-tile {
            background-color: var(--color-secondary);
        }

        a {
            color: var(--text-primary);
            text-decoration: none;
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

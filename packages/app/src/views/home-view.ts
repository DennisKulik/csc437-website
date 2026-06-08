import { css, html, shadow } from "@unbndl/html";
import reset from "../styles/reset.css.ts";
import page from "../styles/page.css.ts";

export class HomeViewElement extends HTMLElement {
    static template = html`
        <template>
            <div class="page">
                <momentum-tasks-holder src="/data/tasks.json"></momentum-tasks-holder>
                <momentum-events-holder src="/api/events/2026-04-05"></momentum-events-holder>
            </div>
        </template>
    `;

    constructor() {
        super();
        shadow(this)
            .template(HomeViewElement.template)
            .styles(reset.styles, page.styles, HomeViewElement.styles);
    }

    static styles = css`
        .page {
            display: grid;
            grid-template-columns: [start] repeat(8, 1fr) [end]
        }

        /* Responsive Sizing */
        @media (max-width: 1100px) {
            .page {
                grid-template-columns: [start] repeat(4, 1fr) [end]
            }
        }

        @media (max-width: 700px) {
            .page {
                grid-template-columns: [start] repeat(1, 1fr) [end]
            }
        }
    `
}
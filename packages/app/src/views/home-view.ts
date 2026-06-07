import { css, html, shadow } from "@unbndl/html";
import reset from "../styles/reset.css.ts";
import index from "../styles/home.css.ts";

export class HomeViewElement extends HTMLElement {
    static template = html`
        <template>
            <momentum-tasks-holder src="/data/tasks.json"></momentum-tasks-holder>
            <momentum-events-holder src="/api/events/2026-04-05"></momentum-events-holder>
        </template>
    `;

    static styles = css`...`;
    
    constructor() {
        super()
        .shadow(this)
            .template(HomeViewElement.template)
            .styles(reset.styles, index.styles, HomeViewElement.styles)
    }

}
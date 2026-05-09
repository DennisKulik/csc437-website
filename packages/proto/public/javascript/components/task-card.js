import { html } from "@unbndl/html";

export class MomentumTaskCard extends HTMLElement {

    static template = html`
        <template>
            <a class="card-layout"></a>
        </template>
    `;

    get href() {
        return this.getAttribute("href") || "";
    }

    get title() {
        return this.getAttribute("title") || "Untitled Task"
    }

    connectedCallback() {
        this.classList.add("card", "task-tile", "hover-lift");

        const content = MomentumTaskCard.template.querySelector("template").content.cloneNode(true);
        const link = content.querySelector("a");

        link.setAttribute("href", this.href);
        link.textContent = this.title;

        this.replaceChildren(
            content
        );
    }

}

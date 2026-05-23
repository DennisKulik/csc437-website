import { html, css, shadow } from "@unbndl/html";
import reset from "/styles/reset.css.js";

export class MomentumHeader extends HTMLElement {

    constructor() {
        super();
        shadow(this)
            .styles(reset.styles, MomentumHeader.styles)
            .replace(MomentumHeader.render()
        );

        const darkModeHolder = this.shadowRoot.getElementById("dark-mode-holder");

        darkModeHolder.addEventListener("change", (event) => {
            if (event.target.id == "dark-mode-toggle") {
                event.stopPropagation();
                relayDarkModeToggle(event.currentTarget, event.target.checked);
            }
        });

        function relayDarkModeToggle(target, checked) {
            const customEvent = new CustomEvent("darkmode:toggle", {
                bubbles: true,
                composed: true,
                detail: { checked }
            });

            target.dispatchEvent(customEvent);
        }
    }

    static render() {
        return html`
            <div class="header">
                <div class="header-left">
                    <svg class="icon-logo">
                        <use href="icons/planning.svg#icon-spiral-main"></use>
                    </svg>
                    <h1>Momentum</h1>
                </div>
                <div class="header-right">
                    <label id="dark-mode-holder">
                        <input id="dark-mode-toggle" type="checkbox" autocomplete="off" />
                        Dark Mode
                    </label>
                    <a href="index.html">Home</a>
                    <a href="" class="disabled">About</a>
                    <a href="" class="disabled">Contact</a>
                    <a href="user.html">
                        <svg class="icon-logo">
                            <use href="icons/planning.svg#icon-user-profile"></use>
                        </svg>
                    </a>
                </div>
            </div>
        `;
    }

    static styles = css`
        :host {
            grid-column: start / end;
            display: block;
        }

        .header {
            display: flex;
            background-color: var(--color-primary);
            padding: var(--padding-mini) var(--padding-small) var(--padding-tiny);
            align-items: center;
            justify-content: space-between;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: var(--padding-small);
        }

        .header-left h1 {
            font-size: 50px;
        }

        .header-right {
            display: flex;
            align-items: center;
            gap: var(--padding-small);
        }

        .header-right a {
            font-size: 24px;
        }

        .header-right label {
            color: var(--text-primary);
            font-size: 22px;
            font-weight: 500;
        }

        svg.icon-logo {
            display: inline-block;
            height: 4.5rem;
            width: 4.5rem;
            color: var(--text-primary);
            fill: currentColor;
        }

        a {
            color: var(--text-link);
        }

        a:visited {
            color: var(--text-link-visited);
        }

        .disabled {
            pointer-events: none;
            cursor: default;
            opacity: 0.9;
        }
    `;
}
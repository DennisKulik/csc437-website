import { html, css, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Auth, fromAuth } from "@unbndl/auth";
import reset from "/styles/reset.css.js";

export class MomentumHeader extends HTMLElement {

    viewModel = createViewModel({
        authenticated: false,
        username: ""
    }).with(fromAuth(this), "authenticated", "username");

    view = html`
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


                ${($) => 
                    $.authenticated 
                    ? html`
                        <a href="user.html" class="logged-in">
                            <svg class="icon-logo">
                                <use href="icons/planning.svg#icon-user-profile"></use>
                            </svg>
                        </a>
                        <button type="button" class="button hover-lift signout-button">
                            Sign Out
                        </button>
                    `
                    : html`
                        <button type="button" class="button hover-lift login-button">Login</button>
                    `
                }
            </div>
        </div>
        `;


    constructor() {
        super();
        shadow(this)
            .styles(reset.styles, MomentumHeader.styles)
            .replace(this.viewModel.render(this.view))
            .delegate(".signout-button", {
                click: () => this.signout()
            })
            .delegate(".login-button", {
                click: () => this.login()
            });

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

    get authorization() {
        const $ = this.viewModel.toObject();
        if ($.authenticated)
            return { Authorization: `Bearer ${$.token}` };
        else return {};
    }

    signout() {
        const customEvent = new CustomEvent("auth:message", {
            bubbles: true,
            composed: true,
            detail: ["auth/signout"]
        });

        this.dispatchEvent(customEvent);
    }

    login() {
        window.location.href = "login.html";
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
            font-family: var(--font-primary);
            color: var(--text-primary);
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

        .button {
            padding: var(--padding-mini);
            margin: 0 var(--padding-tiny) var(--padding-mini);
            border-radius: var(--padding-standard);
            background-color: var(--color-accent-dark);
            color: var(--text-secondary);
            font-family: var(--font-primary);
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
        }

        .hover-lift {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .hover-lift:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .logged-in {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
        }

        .signout-button {
            // height: 50%;
            margin: 0 var(--padding-mini) var(--padding-mini);
        }
    `;
}
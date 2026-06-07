import { html, css, shadow, type Template } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Auth, fromAuth } from "@unbndl/auth";
import reset from "../styles/reset.css.js";
import button from "../styles/button.css.ts";

type HeaderViewModel = {
    authenticated: boolean;
    username: string;
};

export class MomentumHeader extends HTMLElement {

    viewModel = createViewModel<HeaderViewModel>({
        authenticated: false,
        username: ""
    }).with(fromAuth(this), "authenticated", "username");

    view: Template<[HeaderViewModel]> = html`
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
            .styles(reset.styles, button.styles, MomentumHeader.styles)
            .replace(this.viewModel.render(this.view))
            .delegate(".signout-button", {
                click: () => this.signout()
            })
            .delegate(".login-button", {
                click: () => this.login()
            });

        const darkModeHolder = this.shadowRoot!.getElementById("dark-mode-holder") as HTMLElement;

        darkModeHolder.addEventListener("change", (event) => {
            const target = event.target as HTMLInputElement | null;
            const currentTarget = event.currentTarget as HTMLElement | null;

            if (target?.id == "dark-mode-toggle" && currentTarget) {
                event.stopPropagation();
                relayDarkModeToggle(currentTarget, target.checked);
            }
        });

        function relayDarkModeToggle(target: HTMLElement, checked: boolean) {
            const customEvent = new CustomEvent("darkmode:toggle", {
                bubbles: true,
                composed: true,
                detail: { checked }
            });

            target.dispatchEvent(customEvent);
        }
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
            text-decoration: none;
        }

        .logged-in {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
        }

        .signout-button {
            margin: 0 var(--padding-mini) var(--padding-mini);
        }
    `;
}
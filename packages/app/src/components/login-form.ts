import { css, html, shadow, type Template } from "@unbndl/html";
import { createViewModel, fromInputs } from "@unbndl/view";
import reset from "../styles/reset.css.ts";
import { getPostLoginRedirect } from "../session.ts";


type LoginFormViewModel = {
    username: string;
    password: string;
    errorMessage: string;
    submitting: boolean;
};

type LoginFormInputs = {
    username?: string;
    password?: string;
};

export class LoginFormElement extends HTMLElement {
    viewModel = createViewModel<LoginFormViewModel>({
        username: "",
        password: "",
        errorMessage: "",
        submitting: false
    }).with(fromInputs<LoginFormInputs>(this), "username", "password");

    view: Template<[LoginFormViewModel]> = html`
        <form>
            <slot></slot>
            <p class="form-error" role="alert" aria-live="polite">
                ${($) => $.errorMessage}
            </p>
            <button type="submit">
                ${($) => $.submitting ? "Signing in..." : html`<slot name="submit-label">Login</slot>`}
            </button>
        </form>
    `;

    constructor() {
        super();
        shadow(this)
            .styles(reset.styles, LoginFormElement.styles)
            .replace(this.viewModel.render(this.view))
            .listen({
                submit: (ev: Event) => 
                    this.submitLogin(ev, this.getAttribute("api") || "#")
            });
    }

    submitLogin(event: Event, endpoint: string) {
        event.preventDefault();
        const current = this.viewModel.toObject();
        if (current.submitting) return;

        this.viewModel.update({ errorMessage: "", submitting: true });
        const data = this.viewModel.toObject();
        const method = "POST";
        const headers: HeadersInit = {
            "Content-Type": "application/json"
        };
        const body = JSON.stringify(data);
        fetch(endpoint, { method, headers, body })
            .then((res) => {
                if (res.status !== 200)
                    throw `Form submission failed: Status ${res.status}`;
                return res.json();
            })
            .then((json: { token: string}) => {
                const { token } = json;
                const customEvent = new CustomEvent("auth:message", {
                    bubbles: true,
                    composed: true,
                    detail: ["auth/signin", { token, redirect: getPostLoginRedirect() }]
                });
                this.dispatchEvent(customEvent);
            })
            .catch(() => {
                this.viewModel.update({
                    errorMessage: "The username or password was not accepted.",
                    submitting: false
                });
            });
    }

    static styles = css`
        :host {
            display: contents;
        }
        form {
            display: contents;
        }
        button {
            width: fit-content;
            margin: 0 auto;
        }

        .form-error {
            min-height: 1.5em;
            margin: var(--padding-mini) 0;
            color: var(--text-primary);
            text-align: center;
        }

        login-form {
            display: flex;
            flex-direction: column;
            
        }

        login-form label {
            display: flex;
            flex-direction: column;
            gap: var(--padding-mini);
            margin-bottom: var(--padding-standard);

            color: var(--text-primary);
            font-size: 20px;
        }

        login-form input {
            padding: var(--padding-mini);
            border: 2px solid var(--color-primary);
            border-radius: var(--padding-mini);

            font: inherit;
            color: var(--text-primary);
            background-color: var(--color-background);
        }
    `;
}

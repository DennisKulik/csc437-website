import { css, html, shadow, type Template } from "@unbndl/html";
import { createViewModel, fromInputs } from "@unbndl/view";

import reset from "../styles/reset.css.ts";

type RegisterFormViewModel = {
    username: string;
    displayName: string;
    bio: string;
    profilePicture: string;
    password: string;
    errorMessage: string;
    submitting: boolean;
};

type RegisterFormInputs = {
    username?: string;
    displayName?: string;
    bio?: string;
    profilePicture?: string;
    password?: string;
};

export class RegisterFormElement extends HTMLElement {
    viewModel = createViewModel<RegisterFormViewModel>({
        username: "",
        displayName: "",
        bio: "",
        profilePicture: "",
        password: "",
        errorMessage: "",
        submitting: false
    }).with(
        fromInputs<RegisterFormInputs>(this),
        "username",
        "displayName",
        "bio",
        "profilePicture",
        "password"
    );

    view: Template<[RegisterFormViewModel]> = html`
        <form>
            <slot></slot>

            <p class="form-error" role="alert" aria-live="polite">
                ${($) => $.errorMessage}
            </p>

            <button type="submit">
                ${($) => $.submitting ? "Creating account..." : html`<slot name="submit-label">Register</slot>`}
            </button>
        </form>
    `;

    constructor() {
        super();

        shadow(this)
            .styles(reset.styles, RegisterFormElement.styles)
            .replace(this.viewModel.render(this.view))
            .listen({
                submit: (ev: Event) =>
                    this.submitRegistration(ev, this.getAttribute("api") || "#")
            });
    }

    submitRegistration(event: Event, endpoint: string) {
        event.preventDefault();
        const current = this.viewModel.toObject();
        if (current.submitting) return;

        this.viewModel.update({ errorMessage: "", submitting: true });

        const data = this.viewModel.toObject();

        const credentials = {
            username: data.username,
            password: data.password
        };

        const headers: HeadersInit = {
            "Content-Type": "application/json"
        };

        fetch(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(credentials)
        })
            .then((res) => {
                if (res.status !== 201) {
                    throw new Error(`Registration failed: Status ${res.status}`);
                }

                return res.json();
            })
            .then((json: { token: string }) => {
                const { token } = json;

                const profile = {
                    userid: data.username,
                    username: data.username,
                    displayName: data.displayName,
                    bio: data.bio,
                    profilePicture: data.profilePicture
                };

                return fetch("/api/users", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(profile)
                }).then((res) => {
                    if (res.status !== 201) {
                        throw new Error(`Profile creation failed: Status ${res.status}`);
                    }

                    return { token };
                });
            })
            .then(({ token }) => {
                const customEvent = new CustomEvent("auth:message", {
                    bubbles: true,
                    composed: true,
                    detail: ["auth/signin", { token, redirect: "/app" }]
                });

                this.dispatchEvent(customEvent);
            })
            .catch(() => {
                this.viewModel.update({
                    errorMessage: "The account could not be created. The username may already be in use.",
                    submitting: false
                });
            });
    }

    static styles = css`
        :host {
            display: block;
        }

        form {
            display: flex;
            flex-direction: column;
        }

        button {
            align-self: start;
        }

        .form-error {
            min-height: 1.5em;
            margin: var(--padding-mini) 0;
            color: var(--text-primary);
        }
    `;
}

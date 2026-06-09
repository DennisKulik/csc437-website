import { html, css, shadow, type Template } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";

import type { Model } from "../model.ts";
import reset from "../styles/reset.css.ts";
import page from "../styles/page.css.ts";
import user from "../styles/user.css.ts";

export class UserViewElement extends HTMLElement {
    viewModel = createViewModel<Model>({})
        .with(fromStore<Model>(this), "user");
    
    view: Template<[Model]> = html`
        <div class="page">
            <div class="user-info border-small">
                <h2>User Info</h2>

                <div class="user-info-container">
                    <div class="user-section">
                        <h3>Account</h3>

                        <div class="user-section-body">
                            <div class="field">
                                <label for="display-name">Display Name:</label>
                                <input
                                    id="display-name"
                                    type="text"
                                    name="display-name"
                                    value=${($) => $.user?.displayName || ""}
                                />
                            </div>

                            <div class="field">
                                <label for="username">Username:</label>
                                <input
                                    id="username"
                                    type="text"
                                    name="username"
                                    value=${($) => $.user?.username || ""}
                                />
                            </div>

                            <div class="field">
                                <label for="bio">Bio:</label>
                                    <textarea id="bio" name="bio" value=${($) => $.user?.bio || ""}></textarea>
                                </div>

                            <div class="field">
                                <label for="profile-picture">Change Profile Picture:</label>
                                <input id="profile-picture" type="file" name="profile-picture" />
                            </div>
                        </div>
                    </div>

                    <div class="user-section">
                        <h3>Security</h3>

                        <div class="user-section-body">
                            <div class="field">
                                <label for="current-password">Current Password:</label>
                                <input id="current-password" type="password" name="current-password" />
                            </div>

                            <div class="field">
                                <label for="new-password">New Password:</label>
                                <input id="new-password" type="password" name="new-password" />
                            </div>

                            <div class="field">
                                <label for="confirm-password">Confirm New Password:</label>
                                <input id="confirm-password" type="password" name="confirm-password" />
                                <button type="button">Change Password</button>
                            </div>
                        </div>
                    </div>

                    <div class="user-section">
                        <h3>Stats</h3>

                        <div class="user-section-body stats-list">
                            <div class="stat-row">Tasks Completed This Week: 12</div>
                            <div class="stat-row">Current Streak: 5 days</div>
                            <div class="stat-row">Overdue Tasks: 2</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="profile-picture-holder border-small">
                <img
                    src=${($) => $.user?.profilePicture || "/images/default-profile.jpg"}
                    alt="Profile picture"
                />
            </div>
        </div>
    `;


    // static template = html`
    //     <template>
    //         <div class="page">
    //             <div class="user-info border-small">
    //                 <h2>User Info</h2>
    //                 <div class="user-info-container">
    //                     <div class="user-section">
    //                         <h3>Account</h3>
    //                         <div class="user-section-body">
    //                             <div class="field">
    //                                 <label for="display-name">Display Name:</label>
    //                                 <input id="display-name" type="text" name="display-name" value="Current Name" />
    //                             </div>

    //                             <div class="field">
    //                                 <label for="username">Username:</label>
    //                                 <input id="username" type="text" name="username" value="Current Username" />
    //                             </div>

    //                             <div class="field">
    //                                 <label for="profile-picture">Change Profile Picture:</label>
    //                                 <input id="profile-picture" type="file" name="profile-picture" />
    //                             </div>
    //                         </div>
    //                     </div>

    //                     <div class="user-section">
    //                         <h3>Security</h3>
    //                         <div class="user-section-body">
    //                             <div class="field">
    //                                 <label for="current-password">Current Password:</label>
    //                                 <input id="current-password" type="password" name="current-password" />
    //                             </div>

    //                             <div class="field">
    //                                 <label for="new-password">New Password:</label>
    //                                 <input id="new-password" type="password" name="new-password" />
    //                             </div>

    //                             <div class="field">
    //                                 <label for="confirm-password">Confirm New Password:</label>
    //                                 <input id="confirm-password" type="password" name="confirm-password" />
    //                                 <button type="button">Change Password</button>
    //                             </div>
    //                         </div>
    //                     </div>

    //                     <div class="user-section">
    //                         <h3>Stats</h3>
    //                         <div class="user-section-body stats-list">
    //                             <div class="stat-row">Tasks Completed This Week: 12</div>
    //                             <div class="stat-row">Current Streak: 5 days</div>
    //                             <div class="stat-row">Overdue Tasks: 2</div>
    //                         </div>
    //                     </div>
    //                 </div>
    //             </div>

    //             <div class="profile-picture-holder border-small">
    //                 <img src="/images/default-profile.jpg" />
    //             </div>
    //         </div>
    //     </template>
    // `;

    constructor() {
        super();
        shadow(this)
            .styles(reset.styles, page.styles, user.styles, UserViewElement.styles)
            .replace(this.viewModel.render(this.view));
    }

    connectedCallback() {
        const $ = this.viewModel.toObject();

        if (!$.user) {
            Store.dispatch(this, ["user/request", {}]);
        }
    }

    static styles = css`
        .page {
            display: grid;
            grid-template-columns: [start] repeat(8, 1fr) [end];
        }

        @media (max-width: 1100px) {
            .page {
                grid-template-columns: [start] repeat(4, 1fr) [end];
            }
        }

        @media (max-width: 700px) {
            .page {
                grid-template-columns: [start] repeat(1, 1fr) [end];
            }
        }
    `;
    
}
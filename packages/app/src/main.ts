import { define, html } from "@unbndl/html";
import { Auth } from "@unbndl/auth";
import { BrowserHistory, Switch } from "@unbndl/switch";
import { MomentumTaskCard } from "./components/task-card.js";
import { MomentumEventCard } from "./components/event-card.js";
import { MomentumWeekdaySection } from "./components/weekday-section.js";
import { MomentumEventsHolder } from "./components/events-holder.js";
import { MomentumTasksHolder } from "./components/tasks-holder.js";
import { MomentumHeader } from "./components/header-element.ts";

const routes: Switch.Route[] = [
        {
            path: "app/user/",
            view: html`<user-view></user-view>`
        },
        {
            path: "/app",
            view: html`<home-view></home-view>`
        },
        {
            path: "/",
            redirect: "/app"
        }
    ]

define ({
    "auth-provider": Auth.Provider,
    "history-provider": BrowserHistory.Provider,
    "router-switch": class Appswitch extends Switch.Element {
        constructor() {
            super(routes);
        }
    },
    "momentum-header": MomentumHeader,

    "momentum-task-card": MomentumTaskCard,
    "momentum-event-card": MomentumEventCard,
    "momentum-weekday-section": MomentumWeekdaySection,
    "momentum-events-holder": MomentumEventsHolder,
    "momentum-tasks-holder": MomentumTasksHolder
})
import { define } from "@unbndl/html";
import { MomentumTaskCard } from "./components/task-card.js";
import { MomentumEventCard } from "./components/event-card.js";
import { MomentumWeekdaySection } from "./components/weekday-section.js";

define({
    "momentum-task-card": MomentumTaskCard,
    "momentum-event-card": MomentumEventCard,
    "momentum-weekday-section": MomentumWeekdaySection
});

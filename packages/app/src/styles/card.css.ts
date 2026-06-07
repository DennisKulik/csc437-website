import { css } from "@unbndl/html";

const styles = css`
    .card {
        border-radius: var(--padding-mini);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        overflow: hidden;
    }

    .card-layout {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: var(--padding-small);
        padding: var(--padding-small);
    }
`;

export default { styles };

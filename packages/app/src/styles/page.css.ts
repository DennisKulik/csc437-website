import { css } from "@unbndl/html";

const styles = css`
    /* Body */
    body {
        background-color: var(--color-background);
        font-family: var(--font-secondary);
        font-weight: 400;
        font-size: 20px;
        font-style: normal;
    }

    /* Text */

    h1 {
        color: var(--text-primary);
        font-family: var(--font-primary);
        font-weight: 700;
        font-size: 40px;
        font-style: normal;
    }

    p {
        color: var(--text-primary);
        margin: var(--padding-small);
        grid-column: start / end;
    }

    dt {
        color: var(--text-primary);
        margin: var(--padding-small);
    }

    dd {
        margin: var(--padding-small);
    }

    /* Links */

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

    /* Icons */

    svg.icon {
        display: inline;
        height: 2.5rem;
        width: 2.5rem;
        vertical-align: middle;
        fill: currentColor;
    }

    /* Containers */
    .border-mini {
        border: var(--padding-mini) solid var(--color-primary);
        border-radius: var(--padding-mini);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .border-small {
        border: var(--padding-small) solid var(--color-primary);
        border-radius: var(--padding-small);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .border-standard {
        border: var(--padding-small) solid var(--color-primary);
        border-radius: var(--padding-standard);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
`

export default { styles };

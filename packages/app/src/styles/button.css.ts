import { css } from "@unbndl/html";

const styles = css`
    .button {
        padding: var(--padding-mini);
        margin: 0 var(--padding-tiny) var(--padding-mini);
        border-radius: var(--padding-standard);
        background-color: var(--color-accent-dark);
        color: var(--text-secondary);
        font-family: var(--font-primary);
        font-size: 16px;
        font-weight: 600;
    }
    
    .hover-lift {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .hover-lift:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
`;

export default { styles };

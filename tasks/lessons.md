# Lessons Learned

## UI/UX
- **Interaction Accessibility**: Avoid relying solely on CSS `:hover` for critical actions like adding content. Always provide a click-based alternative (like a Popover) for better accessibility and touch support.
- **Empty States**: Empty state areas that look actionable (e.g., "Add one below") should be clickable buttons, not just static text.

## Debugging
- **Verification**: Verifying UI interactions (popovers, menus) is best done with a browser agent that can click and capture screenshots.

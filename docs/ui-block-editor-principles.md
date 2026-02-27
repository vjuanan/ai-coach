# UI Block Editor Principles

## Mandatory Design Direction
- Minimalist OpenAI style for all block-editor controls.
- No decorative UI that does not improve task speed.
- Numeric inputs must be compact and sized to expected content.
- Eliminate dead space around inputs, toggles, and field groups.

## Layout Rules
- Desktop: main block inputs must fit in one row whenever possible.
- Mobile: allow wrapping, but keep dense spacing and no empty gutters.
- Avoid fixed wide wrappers for numeric-only controls.

## Input Sizing Rules
- Use explicit width buckets by data type:
- `short`: 1-2 digits.
- `medium`: 3-4 digits.
- `time`: `MM:SS`.
- Do not auto-expand width based on user text.

## Presets Rules
- Presets must not live as a right-side column inside inputs.
- Place presets below the input or in a compact popover.
- Presets must preserve compact height and spacing.

## Consistency Rules
- Keep border radius soft and consistent.
- Keep compact heights consistent across editors.
- Validation states (error/focus/hover) must stay minimal and dense.

## Coverage Scope
- Apply these rules to all block editor surfaces:
- Strength form.
- Generic movement form.
- Dynamic methodology fields.
- Specialized methodology editors (EMOM, AMRAP/RFT/FOR_TIME/CHIPPER, Tabata).
- Table breakdown inputs.

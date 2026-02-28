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
- Stimulus selection uses a single-layer picker: never render visual subcategory tabs (MetCon/HIIT/Classic/Acondicionamiento) inside the editor.
- After choosing stimulus, collapse to a compact header (`Tipo de estímulo` + selected value + `Editar`).
- If only one stimulus category is available, render `Tipo de estímulo` with a compact category badge and never a full-width rail/tab row.
- Warmup top controls (`Por Vueltas/Por Series` + `Rondas/Vueltas`) must be rendered as a single compact horizontal band.
- In warmup, `Rondas/Vueltas` must use a subtle inline control (micro label + short input + 3 chips), never a dominant standalone card.
- `warmup`, `accessory`, and `skill` movement cards must render in two columns from `xl` (`>=1280px`) and center the last incomplete row.
- Main numeric input rows must use fluid distribution (`100%` container width) with dynamic percentage-based card widths.

## Input Sizing Rules
- Use explicit width buckets by data type:
- `short`: 1-2 digits.
- `medium`: 3-4 digits.
- `time`: `MM:SS`.
- Do not auto-expand width based on user text.
- Numeric block-editor cards must use fixed width classes and never `flex-1`.
- Fluid rows must keep compact inner input widths by data type while allowing outer card containers to stretch (`layout='fluid'`).

## Presets Rules
- Presets must not live as a right-side column inside inputs.
- Place presets below the input or in a compact popover.
- Presets must preserve compact height and spacing.
- Visible presets must be capped at `3` using strategic selection (`min`, `middle`, `max`).
- Finisher numeric fields must expose `3` strategic presets (manual entry remains available).

## Consistency Rules
- Keep border radius soft and consistent.
- Keep compact heights consistent across editors.
- Validation states (error/focus/hover) must stay minimal and dense.
- Finisher methodology tabs must never use `flex-1`; tabs stay compact and centered.
- Card labels must avoid accidental wrapping by using explicit `labelLines` (`1` or `2`) instead of uncontrolled line breaks.
- Single-metric exercise inputs (for example, warmup repetitions) must remain centered with bounded useful width and must not appear as tiny cards floating in oversized empty containers.
- Movement-card metrics must be centered and occupy useful width (no mini islands with dominant lateral dead space).
- Global per-exercise fields (for example `Reps base`) must include explicit contextual copy (`aplica a cada ejercicio`) to avoid orphan labels.

## Coverage Scope
- Apply these rules to all block editor surfaces:
- Strength form.
- Generic movement form.
- Dynamic methodology fields.
- Specialized methodology editors (EMOM, AMRAP/RFT/FOR_TIME/CHIPPER, Tabata).
- Table breakdown inputs.

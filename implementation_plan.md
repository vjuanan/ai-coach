# Implementation Plan - Block Ready State

The goal is to show a "Green Tick" on the workout block card when the user clicks "OK" in the Block Editor, indicating the block is "ready" or "completed".

## Proposed Changes

### 1. Data Structure (`lib/supabase/types.ts`)
*   Add `is_completed?: boolean` to the `WorkoutConfig` related interfaces (or rely on dynamic nature since it's JSONB, but better to document in types if possible).
*   *Self-correction*: Since `WorkoutConfig` is a union of types which all have `[key: string]: any`, strictly speaking, we don't *need* to change the types to make it work, but adding it to `StrengthConfig`, `MetconConfig`, etc. makes it explicit. For now, I will treat it as an optional property in the config object.

### 2. Block Editor (`components/editor/BlockEditor.tsx`)
*   Modify the "OK" button's `onClick` handler.
*   Current behavior: `if (isValid) selectBlock(null);`
*   New behavior:
    *   Set `config.is_completed = true`.
    *   Call `updateBlock(blockId, { config: newConfig })`.
    *   Then `selectBlock(null)`.

### 3. Workout Block Card (`components/editor/WorkoutBlockCard.tsx`)
*   Read `is_completed` from `block.config`.
*   If `is_completed` is true:
    *   Display a green Check / Tick icon.
    *   Proposed location: In the header row, next to the block name or the "Quick Actions".
    *   I will place it to the right of the block name, or maybe on the far right if space permits.
    *   Use `CheckCircle` or `Check` icon from `lucide-react` with a green color (`text-green-500` or `text-cv-success`).

## Verification Plan

### Manual Verification
1.  Open the workout editor.
2.  Click on a block to edit it.
3.  Fill in required fields if empty.
4.  Click "OK".
5.  Observe the block card in the list collapses.
6.  **Verify**: The block card now displays a Green Tick.
7.  Click the block again.
8.  **Verify**: The editor opens. The `config` should still have `is_completed: true` until manually unset (not implementing unset logic unless needed, user only asked "al apretar OK... aparezca Tick").

### Automated Verification
*   I will use the browser tool to perform the manual steps above.

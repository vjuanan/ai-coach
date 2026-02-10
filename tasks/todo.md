# Task: Calentamiento UI Fix

- [x] Locate the component rendering "Metodología de Entrenamiento" <!-- id: 0 -->
- [x] Identify the code responsible for the "empty bar" (SmartExerciseInput & Description) <!-- id: 1 -->
- [ ] Implement Fixes <!-- id: 2 -->
    - [ ] Hide `currentMethodology.description` for Warmup blocks in `BlockEditor.tsx`
    - [ ] Update `useExerciseCache.ts` to support empty queries (show all/recent)
    - [ ] Update `SmartExerciseInput.tsx` to trigger search on focus
- [ ] Verify the fix <!-- id: 3 -->

## Implementation Plan

### Goal
Resolve the issue where the user sees a "useless bar" and a confusing description in the Warmup block before selecting a methodology. The "bar" is identified as the Exercise Search Input, which currently does not show results when clicked if empty, and the description "Traditional strength training" is misleading for Warmup.

### Proposed Changes
1. **BlockEditor.tsx**: Hide the description text if `block.type === 'warmup'`.
2. **useExerciseCache.ts**: Modify `searchLocal` to return first 50 results if query is empty (length < 2).
3. **SmartExerciseInput.tsx**: Modify `onFocus` to open dropdown immediately (`setIsOpen(true)`) regardless of query length, relying on `searchLocal` handling empty queries.

### Verification
- Check Warmup UI for hidden description.
- Click on "Buscar ejercicio..." input and verify dropdown appears with list of exercises.

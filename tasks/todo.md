# Task: Calentamiento UI Fix

- [x] Locate the component rendering "Metodología de Entrenamiento" <!-- id: 0 -->
- [x] Identify the code responsible for the "empty bar" (SmartExerciseInput & Description) <!-- id: 1 -->
- [x] Implement Fixes <!-- id: 2 -->
    - [x] Hide `currentMethodology.description` for Warmup blocks in `BlockEditor.tsx`
    - [x] Update `useExerciseCache.ts` to support empty queries (show all/recent)
    - [x] Update `SmartExerciseInput.tsx` to trigger search on focus
- [ ] Verify the fix <!-- id: 3 -->
    - [ ] Push to GitHub
    - [ ] Verify on Production

# Task: Calentamiento UI Fix

- [x] Locate the component rendering "Metodología de Entrenamiento" <!-- id: 0 -->
- [x] Identify the code responsible for the "empty bar" (SmartExerciseInput & Description) <!-- id: 1 -->
- [x] Implement Fixes <!-- id: 2 -->
    - [x] Hide `currentMethodology.description` for Warmup blocks in `BlockEditor.tsx`
    - [x] Update `useExerciseCache.ts` to support empty queries (show all/recent)
    - [x] Update `SmartExerciseInput.tsx` to trigger search on focus
    - [x] Fix build error in `lib/store/index.ts` (Restructure and missing methods)
    - [x] Fix build error in `BlockBuilderPanel.tsx` (Type mismatch)
- [ ] Verify the fix <!-- id: 3 -->
    - [x] Push to GitHub
    - [ ] Verify on Production (Attempt 4)

# Task: Exercise Modal Fix + Cue System

## 1. Fix Warmup Block Display (No Reps/Cues in Editor)
- [ ] Fix `MovementsListField` and warmup movement strings to only show exercise name
- [ ] Ensure `GenericMovementForm` is the form used for warmup blocks (not `MovementsListField`)
- [ ] Validate that exercise search/autocomplete works in warmup section

## 2. Enforce Library-Only Exercises
- [ ] Block saving blocks with exercises NOT in the library
- [ ] Add validation in `useBlockValidator` for warmup/accessory movements
- [ ] Show warning before discarding incomplete blocks

## 3. Add `cue` Field to Exercise Library (DB)
- [ ] Create DB migration: `ALTER TABLE exercises ADD COLUMN cue TEXT`
- [ ] Update TypeScript `Exercise` type in `types.ts`
- [ ] Run migration against production Supabase

## 4. Populate Cues for Antopanti Exercises
- [ ] Create script to extract cue text from Antopanti program `config.notes`
- [ ] Update exercises in DB with their respective cues
- [ ] Remove "Cue:" prefix from `config.notes` (keep non-cue notes)

## 5. Hide Cues in Block Editor
- [ ] Ensure cues do NOT appear in `BlockEditor.tsx`, `GenericMovementForm.tsx`, or `MovementsListField`
- [ ] Notes field should only show non-cue notes

## 6. Show Cues in Export Preview
- [ ] Modify `export-helpers.ts` (`prepareProgramForExport`) to look up exercise cue from library
- [ ] Verify `ExportPreviewV2.tsx` renders cues properly

## 7. Verification
- [ ] Push to production
- [ ] Screenshot: Block editor (warmup) → no cues, names only
- [ ] Screenshot: Block editor (strength) → no cues in notes
- [ ] Screenshot: Export preview → cues visible for each exercise
- [ ] Screenshot: Search/autocomplete working in warmup section

## Block Size Consistency
- [x] Fix variable block width (set fixed width 160px)
- [x] Add truncation for long names
- [x] Add hover tooltip
- [x] Verify on production (screenshot captured)

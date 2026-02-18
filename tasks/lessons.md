# Lessons Learned

## 2026-02-18: Topbar Button Consistency

### Problem
Using different CSS approaches (`cv-btn-ghost` class, raw `p-2`, explicit `w-X h-X`) for icon buttons leads to invisible size mismatches.

### Rule
**All icon-only buttons in the topbar must use explicit `w-9 h-9 flex items-center justify-center` containers.** Never rely on padding alone (`p-2`) or utility classes (`cv-btn-ghost`) for sizing icon buttons — they include padding/gap from base classes that cause visual inconsistency.

### Checklist for icon buttons
- [ ] Same container: `w-9 h-9 flex items-center justify-center rounded-lg`
- [ ] Same icon size: `size={20}`
- [ ] Same stroke: `strokeWidth={1.5}`
- [ ] Same gap between buttons: `gap-1.5`

## 2026-02-18: Export vs Save Validation

### Problem
`handleExportClick` reused the strict `validateBlockContent` function (which requires sets+reps+intensity+rest for strength, matching exercises in cache for metcons). This flagged 44 blocks as "incomplete" and blocked export with a scary warning, even though the data was perfectly fine for rendering.

### Rule
**Export validation must be LENIENT.** The export preview already handles missing fields gracefully. Never gate export behind the same strict validation used for saving blocks. For export, just open the preview directly.

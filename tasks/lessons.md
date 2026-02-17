# Lessons Learned

## Template Updates
- [ ] Make sure to fetch latest DB schema before updating.

## Export / html2canvas
- **NEVER use `flex` on a scroll container that wraps dynamic-height content.** `flex justify-center` constrains the child's computed height to the viewport, causing background cutoff AND export clipping. Use `margin: 0 auto` on the child for centering instead.
- **Always pass explicit `width`, `height`, `scrollX`, `scrollY`, `windowWidth`, `windowHeight` to html2canvas** based on `el.scrollHeight` / `el.scrollWidth`. Without this, html2canvas captures only the visible portion.
- **In `onclone`, force `height: auto` and `overflow: visible`** on the cloned element to undo any CSS constraints.
- **Verify fixes by scrolling to the ABSOLUTE bottom** of the preview and taking screenshots of both top AND bottom. A fix isn't verified unless you see the footer.

## Deployment Debugging
- **If deployment seems stuck or features are missing despite successful git push**, check the build logs or run `npm run build` / `npm run type-check` locally. Silent build failures (like missing exports or TS errors) can prevent Vercel from deploying the new commit, leaving the live site on an old version.

## Git & Deployment
- **Ambiguous Git Status**: If `git status` is clean but `git log` seems outdated or incorrect, trust the actual file content on disk. If files are modified but `git status` claims clean, they are committed. Always double-check with `git show HEAD` or by pushing.
- **Verification**: Always verify production changes with a fresh browser session (incognito/cleared cookies) to avoid caching issues.


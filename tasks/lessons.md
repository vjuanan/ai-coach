# Lessons Learned

- Always check if `IsArtifact` should be false when writing to project directories.
- When a child component uses `e.stopPropagation()` in its onClick handler, the parent wrapper's onClick will NOT be triggered. If you need both to fire, add the action to the child component directly instead of relying on event bubbling.
- **html2canvas**: Avoid using Tailwind CSS classes and CSS variables in content that will be captured by `html2canvas`. Use inline `style={}` with hardcoded colors and explicit layout properties (flexbox/grid) for reliable export results.


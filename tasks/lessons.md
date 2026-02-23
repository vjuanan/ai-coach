# Lecciones Aprendidas

## React Hooks Rules
- **NEVER** place `useMemo`, `useState`, `useCallback` etc. after an early `return` in a component. This violates React's rules of hooks and will cause build failures (ESLint `react-hooks/rules-of-hooks` error).
- When a component has `if (condition) return <JSX/>` patterns, ALL hooks must be declared BEFORE any conditional returns.

## Component Discovery
- **Always verify which component is actually rendered in production** before modifying code. The app may have multiple components with similar functionality (e.g., `GymProfileEditor.tsx` vs `GymDetailsEditor.tsx`) and only one is actually used for a given page.
- Use `grep` for visible text strings from screenshots to find the real component.

## Build Verification
- **Always run `npx next build`** locally before pushing to verify there are no build-blocking errors.
- Vercel won't deploy if the build fails, so changes will silently not appear in production.

## Deployment Timing  
- Vercel deployments typically take 60-90 seconds after push. Wait at least 90 seconds before verifying production.

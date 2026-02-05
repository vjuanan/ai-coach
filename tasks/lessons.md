# Lessons Learned

- **Verification & Caching**: When removing UI components in a Next.js environment, hot module replacement (HMR) or browser caching might persist the old component in the active session. Verification should ensure a hard refresh or server restart if possible, or verify source code changes as the source of truth when UI behavior is inconsistent.
- **Data Validation & Export Clarity**: 
    - Always implement strict validation for user inputs (e.g., prevent saving blocks without essential data like Sets/Reps). Incomplete data leads to confusing UI states.
    - separate quantitative data (Sets/Reps) from qualitative notes (Technical cues) in exports. Mixing them confusingly can degrade the user experience.

# Lessons Learned

- Always check the data structure of the objects being iterated.
- Verify component props to ensure correct data is passed.
- **Check for Local Function Shadowing**: In `MesocycleEditor.tsx`, local helper functions with the same name as imported ones were being used, bypassing updates made to the imported helpers. Always verify which function definition is active.
- **Unified Logic**: Centralize logic (like export helpers) to avoid discrepancies between components.

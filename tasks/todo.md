# KG Calculation Fix - Task Checklist

## Planning
- [x] Investigate data storage (benchmarks in `clients.details.oneRmStats`)
- [x] Trace KG calculation pipeline (`WorkoutBlockCard` → `useAthleteBenchmarks` → `getBenchmark`)
- [x] Add debug logging and deploy to production
- [x] Confirm root cause: `programClient` stays null in Zustand store
- [x] Create implementation plan

## Implementation
- [ ] Add `setProgramClient` action to Zustand store (`lib/store/index.ts`)
- [ ] Update `MesocycleEditor.tsx` `onAssignSuccess` to fetch full client and update store
- [ ] Remove debug logging from `useAthleteBenchmarks.ts`

## Verification
- [ ] Deploy changes to production
- [ ] Browser test: assign athlete with benchmarks → verify KG appears
- [ ] Browser test: reload page → verify KG persists
- [ ] Screenshot verification
- [ ] Update lessons.md

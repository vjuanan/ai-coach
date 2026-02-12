# KG Calculation Fix - Task Checklist

## Planning
- [x] Investigate data storage (benchmarks in `clients.details.oneRmStats`)
- [x] Trace KG calculation pipeline (`WorkoutBlockCard` → `useAthleteBenchmarks` → `getBenchmark`)
- [x] Add debug logging and deploy to production
- [x] Confirm root cause: `programClient` stays null in Zustand store
- [x] Create implementation plan

## Implementation
- [x] Add `setProgramClient` action to Zustand store (`lib/store/index.ts`)
- [x] Update `MesocycleEditor.tsx` `onAssignSuccess` to fetch full client and update store
- [x] Remove debug logging from `useAthleteBenchmarks.ts`

## Verification
- [x] Deploy changes to production
- [x] Browser test: assign athlete with benchmarks → KG appears ✅
- [x] Screenshot verification (75kg and 80kg calculated correctly from 100kg RM)

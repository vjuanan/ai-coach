# Implementation Plan: RM Tracking & KG Calculation

## Goal Description
Implement a feature to track athletes' Rep Max (RM) for key lifts and run times. Use this data to automatically calculate and display KG values in the workout editor when a percentage is used, and include these values in the text export.

## User Review Required
> [!NOTE]
> No breaking changes. New fields are additive to the `clients.details` JSONB column.

## Proposed Changes

### Data Model & Actions
#### [MODIFY] [actions.ts](file:///Users/juanan/Library/CloudStorage/OneDrive-EPNStore/Team%20Ventas%20y%20Administracion%20%F0%9F%A4%91/AI%20Deveolpments/AI%20Coach/lib/actions.ts)
- Updated `updateAthleteProfile` to handle `oneRmStats` and time benchmarks (`franTime`, `run1km`, `run5km`).
- Logic added to update `clients.details` for both coach-created and self-registered athletes (via linked client record).

### Logic & Hooks
#### [NEW] [useAthleteRm.ts](file:///Users/juanan/Library/CloudStorage/OneDrive-EPNStore/Team%20Ventas%20y%20Administracion%20%F0%9F%A4%91/AI%20Deveolpments/AI%20Coach/hooks/useAthleteRm.ts)
- Created `useAthleteRm` hook to resolve exercise names (fuzzy matching) to RM keys.
- Implemented `calculateKg` helper to compute weight based on `% 1RM` and round to nearest 0.5kg.
- Exported `calculateKgFromStats` for use in non-hook contexts (Export).

### UI Components
#### [MODIFY] [athletes/page.tsx](file:///Users/juanan/Library/CloudStorage/OneDrive-EPNStore/Team%20Ventas%20y%20Administracion%20%F0%9F%A4%91/AI%20Deveolpments/AI%20Coach/app/(dashboard)/athletes/page.tsx)
- Added new benchmark fields (Strict Press, Bench Press, Run times) to the athlete creation form.

#### [MODIFY] [athletes/[clientId]/page.tsx](file:///Users/juanan/Library/CloudStorage/OneDrive-EPNStore/Team%20Ventas%20y%20Administracion%20%F0%9F%A4%91/AI%20Deveolpments/AI%20Coach/app/(dashboard)/athletes/[clientId]/page.tsx)
- Replaced static benchmarks card with `BenchmarksEditor` to allow editing RMs.

#### [MODIFY] [BlockEditor.tsx](file:///Users/juanan/Library/CloudStorage/OneDrive-EPNStore/Team%20Ventas%20y%20Administracion%20%F0%9F%A4%91/AI%20Deveolpments/AI%20Coach/components/editor/BlockEditor.tsx)
- Integrated `useAthleteRm` into `StrengthForm`.
- Added a "badge" capability to `InputCard` to display the calculated KG (e.g., `≈ 80kg`) when `% 1RM` is selected.

#### [MODIFY] [MesocycleEditor.tsx](file:///Users/juanan/Library/CloudStorage/OneDrive-EPNStore/Team%20Ventas%20y%20Administracion%20%F0%9F%A4%91/AI%20Deveolpments/AI%20Coach/components/editor/MesocycleEditor.tsx)
- Updated `convertConfigToText` to accept `oneRmStats` and append calculated KG to the export text.
- Updated `exportWeeks` memo to pass `programClient.details.oneRmStats` to the text converter.

## Verification Plan

### Manual Verification
1.  **Athlete Profile**: Go to an athlete's page, edit "Marcajes", add a Back Squat RM (e.g., 100kg). Save.
2.  **Block Builder**: Go to the Program Editor for that athlete. Add a "Squat" block.
3.  **KG Calculation**: Select `% 1RM` intensity. Enter usage `80%`.
4.  **Verify**: Confirm a badge `≈ 80kg` appears.
5.  **Export**: Click "Exportar".
6.  **Verify Export**: Check the preview text. It should say something like `4 x 10 @ 80% (≈80kg)`.

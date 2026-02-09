# Implementation Plan: Handle Profile Assignation in Template Duplication

The goal is to fix the Foreign Key violation error when assigning a template to a "Profile" (Athleta/Gym) that does not yet have a corresponding "Client" record.

## User Review Required
> [!IMPORTANT]
> This change will automatically create a new `Client` record in the database when a user assigns a template to a platform `Profile` (registered user) that is not yet in the coach's `Client` list. This effectively "onboards" the user as a client of the coach.

## Proposed Changes

### [Backend Logic] `lib/actions.ts`

#### [MODIFY] [actions.ts](file:///Users/juanan/Library/CloudStorage/OneDrive-EPNStore/Team%20Ventas%20y%20Administracion%20%F0%9F%A4%91/AI%20Deveolpments/AI%20Coach/lib/actions.ts)
- [x] Modified `copyTemplateToProgram` function.
    - Removed auto-creation logic.
    - Strictly expects a valid `client_id` from the `clients` table.
- [x] Modified `getClients` function.
    - **Removed** logic that fetched profiles for admins.
    - Now strictly returns records from the `clients` table for ALL users (Admins and Coaches).
    - Admins see all clients; Coaches see only their assigned clients.

## Verification Plan

### Automated Tests
- None exist for this specific flow.

### Manual Verification
1.  **Select a Profile**: In the "Duplicate Template" dialog, select an "Atleta" who is a registered user (Profile) but NOT yet in the Clients list (indicated by coming from the profiles section, or typically just appear in the list if not already a client).
2.  **Confirm**: Click "Confirmar".
3.  **Result**:
    -   The system should NOT show an error.
    -   Redirection to the editor should happen.
    -   A new `client` should be created in the database (can verify by going to Clients page if it exists, or checking DB if possible).
    -   The program should be assigned to this new client.

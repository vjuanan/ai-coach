# Active Tasks

- [ ] Vista Global de Progresiones
    - [ ] Crear `ProgressionPreview.tsx` - Componente principal
    - [ ] Crear `ProgressionBlockCard.tsx` - Tarjeta por semana
    - [ ] Modificar `BlockEditor.tsx` - Integrar componente
    - [ ] Verificar con screenshots en producción
    - [ ] Validar edición cruzada entre semanas

# Completed Tasks

- [x] Optimize "Configurar Mesociclo" Modal
    - [x] Locate `ProgramSetupWizard.tsx` (Done)
    - [x] Analyze current layout structure (Done)
    - [x] Plan layout adjustments (compact spacing, flex layout) (Done)
    - [x] Implement changes in `ProgramSetupWizard.tsx` (Done/Verified)
    - [x] Verify modal fits without scrolling (Done/Verified via Browser Agent)

- [x] Reorder Block Editor Buttons
    - [x] Remove top "LISTO" buttons from BlockEditor
    - [x] Add bottom action bar with "Eliminar" and "LISTO" (50/50 split)
    - [x] Verify UI on production URL

# Backlog
- [ ] Redesign MetCon Methodology Editor
    - [x] Plan and Design UI/UX for specialized editors (EMOM, AMRAP, etc.)
    - [x] Refactor BlockEditor to support specialized sub-editors
    - [x] Implement EMOM Editor (Minute slots)
    - [x] Implement AMRAP/RFT Editors (Circuit logic)
    - [x] Verify new UI behaviors

- [x] Fix "Nombre del Bloque" Label
    - [x] Search for occurrences
    - [x] Update labels and placeholders to "Ejercicio"
    - [x] Verify all modals
    - [x] Deploy changes to production
    - [x] Verify fix on production

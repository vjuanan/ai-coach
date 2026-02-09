#- [x] **Modificar Store** (`lib/store/index.ts`)
  - [x] Actualizar `toggleBlockProgression` para aceptar `progressionVariable`
  - [x] Guardar `progression_variable` en config del bloque

- [x] **Modificar BlockEditor** (`components/editor/BlockEditor.tsx`)
  - [x] Agregar selector de variable al activar switch de Progresión
  - [x] Opciones: Series, Repeticiones, % 1RM
  - [x] Hacer obligatorio elegir una opción

- [x] **Modificar Exportación**
  - [x] Actualizar `MesocycleEditor.tsx` para extraer `progression_variable`
  - [x] Actualizar `ExportPreview.tsx` para mostrar badges VOLUMEN/FUERZA

- [x] **Modificar ProgressionPreview** (`components/editor/ProgressionPreview.tsx`)
  - [x] Identify the components responsible for the export view.
- [x] Fix the header alignment (Name, Gym, Week count).
- [x] Fix the Weekly Detail alignment (Title, Objective, Days).
- [x] Verify the changes by code review.
- [x] Manual verification by user (as requested).

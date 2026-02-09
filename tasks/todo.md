# Tareas Pendientes

- [x] Analizar estructura de `MesocycleEditor.tsx` y `BlockBuilderPanel.tsx`
- [x] Mover el encabezado de "Block Builder" a la izquierda de las semanas en `MesocycleEditor.tsx`
- [x] Compactar el encabezado
- [x] Reemplazar botón "Guardar" con "Guardar y Salir" en la barra superior cuando el Builder está activo
- [x] Implementar auto-guardado al salir (Escape o Atrás)
- [ ] Verificar cambios y asegurar que no se puede salir sin guardar

# Revisión de Resultados

- Se modificó `MesocycleEditor.tsx` para integrar el título "Block Builder" en la barra de herramientas principal.
- Se implementó la lógica de `handleSaveAndExit` para guardar automáticamente al salir.
- Se reemplazó el botón "Guardar" con "Guardar y Salir" en modo Block Builder.
- Se eliminó el encabezado redundante de `BlockBuilderPanel.tsx`.

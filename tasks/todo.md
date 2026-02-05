# Delete Block on Hover

## Objetivo
Agregar funcionalidad de eliminación de bloques con icono X al hacer hover.
- Bloque vacío → eliminar inmediatamente
- Bloque con contenido → pedir confirmación

## Tareas

- [/] Analizar estructura actual de `WorkoutBlockCard`
- [/] Crear plan de implementación
- [ ] Modificar `WorkoutBlockCard.tsx`:
  - [ ] Agregar icono X en lugar de/junto a Trash2
  - [ ] Crear función `isBlockEmpty()` para determinar si un bloque tiene contenido
  - [ ] Agregar diálogo de confirmación para bloques con contenido
- [ ] Actualizar estilos del botón X
- [ ] Push y verificar en producción

# Implementar Click en Área de Bloque

## Objetivo
- Al hacer hover sobre cualquier área del bloque, poder hacer click para ir a la edición del mismo (sin seleccionar un componente específico)
- Si se hace click sobre un componente específico, se abre directamente ESE componente

## Tareas

- [x] Analizar estructura actual de bloques y componentes
- [x] Modificar `WorkoutBlockCard.tsx` para:
  - Hacer clickeable toda el área del bloque → abre Block Builder con el bloque seleccionado
  - Detectar clicks en ejercicios específicos → abre Block Builder en ese ejercicio
- [x] Agregar indicador visual de hover en el área del bloque
- [x] Solucionar conflicto de Click vs Drag (Mover listener al Grip)
- [x] Verificar cambios en producción con screenshots

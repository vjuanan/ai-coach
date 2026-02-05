# Delete Block on Hover

## Objetivo
Agregar funcionalidad de eliminación de bloques con icono X al hacer hover.
- Bloque vacío → eliminar inmediatamente
- Bloque con contenido → pedir confirmación

## Tareas

- [x] Analizar estructura actual de `WorkoutBlockCard`
- [x] Crear plan de implementación
- [x] Modificar `WorkoutBlockCard.tsx`:
  - [x] Agregar icono X en lugar de Trash2
  - [x] Crear función `isBlockEmpty()` para determinar si un bloque tiene contenido
  - [x] Agregar diálogo de confirmación para bloques con contenido
- [x] Actualizar estilos del botón X (hover rojo)
- [x] Push a GitHub
- [ ] Verificar en producción (pendiente - error de cuota del browser)

## Cambios Realizados

### `components/editor/WorkoutBlockCard.tsx`
- Agregado ícono `X` de lucide-react
- Nueva función `isBlockEmpty()` que detecta si el bloque tiene contenido según su tipo
- Lógica condicional en `handleDelete`:
  - Progresión → muestra diálogo de progresión
  - Bloque vacío → elimina inmediatamente
  - Bloque con contenido → muestra nuevo diálogo de confirmación
- Nuevo diálogo de confirmación con botones "Cancelar" y "Eliminar"

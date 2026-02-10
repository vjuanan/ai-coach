# Eliminación Automática de Bloques Vacíos

## Problema
- [x] Los bloques que se agregan pero no se completan (sin ejercicios/contenido) quedan visibles
- [x] Ejemplo: bloques de CALENTAMIENTO, ACCESORIO, HABILIDAD sin contenido

## Análisis
- [x] Investigar cuándo detectar que un bloque está vacío
- [x] Determinar el mejor momento para eliminar (al salir del editor, al deseleccionar, etc.)
- [x] Verificar la función `isBlockEmpty` existente en `BlockBuilderPanel.tsx`
- [x] Analizar el flujo de guardado y autosave

## Implementación
- [x] Implementar hook/efecto que detecte bloques vacíos al salir del Block Builder
- [x] Integrar con el store de Zustand (`useEditorStore`)
- [x] Agregar función de limpieza automática en el momento apropiado
- [x] Optimizar velocidad de salida (defer blocking logic) para evitar lag
- [ ] Considerar UI feedback (opcional: mensaje breve)

## Verificación
- [x] Probar agregando bloques vacíos y verificar que se eliminan
- [x] Probar agregando bloques con contenido mínimo y verificar que NO se eliminan
- [x] Verificar en producción con screenshots
- [x] Confirmar que no afecta el flujo de trabajo normal

# Corregir Header del Editor

## Problema
- [x] El día aparece duplicado: en el header superior (pequeño/badge) y en el card principal (grande/selector).
- [x] El usuario quiere eliminar el etiqueta del header superior y mantener el selector grande.

## Acciones
- [x] Revertir cambios incorrectos en SingleDayView.tsx (restaurar selector grande).
- [x] Modificar MesocycleEditor.tsx para eliminar el label de día del header superior.
- [x] Verificar que los cambios se hayan pusheado correctamente.

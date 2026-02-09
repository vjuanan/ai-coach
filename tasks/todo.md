# Progression Mode Fixes

## Issues to Fix
- [/] **BUG 1**: Ejercicio en "Modo progresión" no se duplica en todas las semanas
- [ ] **BUG 2**: Drag and drop dice "se va a modificar en TODAS las semanas" (error - debe poder mover solo el bloque de esa semana)
- [ ] **BUG 3**: Drag and drop tiene mucho lag en la transición del efecto
- [ ] **BUG 4**: Debe poder arrastrar desde cualquier parte del bloque, no solo los puntos del grip

## Tasks
- [/] Investigar código actual de progresiones
- [ ] Crear implementation_plan.md
- [ ] Revisar funcionalidad de `toggleBlockProgression` en store
- [ ] Corregir lógica de drag and drop para bloques con progression_id
- [ ] Mover listeners de drag al bloque completo
- [ ] Mejorar animación/transición de drag overlay
- [ ] Verificar en producción

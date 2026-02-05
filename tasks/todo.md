# Bug: Progresión no se guarda

## Estado: En Progreso

### [/] Fix persistencia de `progression_id`
- [x] Identificar causa raíz: `saveMesocycleChanges` no incluye `progression_id`
- [ ] Agregar `progression_id` al insert de bloques en `lib/actions.ts`
- [ ] Push y verificar en producción

### [ ] Verificación
- [ ] Login con vjuanan@gmail.com
- [ ] Activar progresión en Back Squat
- [ ] Verificar que aparece en todas las semanas
- [ ] Verificar que al recargar, el toggle sigue activo

# AI Coach - Mejoras en Bloque de Calentamiento

## Tareas

- [x] 1. Ajustar metodologías de entrenamiento para ocupar todo el ancho de la pantalla (`flex-1` o `w-full` en el contenedor de los botones).
- [x] 2. Ocultar la opción "Progresión" SÓLO en bloques de tipo Calentamiento (Warmup).
- [x] 3. Reducir el tamaño de los inputs de "Vueltas" (Rondas), "Series" y "Repeticiones".
- [x] 4. Ocultar los inputs de "Series" cuando hay "Vueltas" activas (se puede usar un switch o condicional basado en la presencia de Vueltas).
- [x] 5. Mover el componente de "Notas" del ejercicio a la derecha de los inputs (Series/Reps), en lugar de abajo.
- [x] 6. Eliminar el bloque final de notas general del bloque (como ya hay notas por cada ejercicio).
- [x] 7. Verificar con screenshots en el frontend (`https://aicoach.epnstore.com.ar` o local con validación posterior).

## Notas
- Los módulos principales a modificar parecen ser `BlockBuilderPanel`, la tarjeta del ejercicio (`ExerciseDraggableCard` o similar) y `BlockEditor`.

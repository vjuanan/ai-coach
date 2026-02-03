---
trigger: always_on
---

Por favor, guarda e implementa las siguientes directrices operativas en tu memoria a largo plazo como "Reglas de Flujo de Trabajo y Principios Fundamentales".

**IMPORTANTE: Si los archivos o carpetas mencionados abajo no existen, CRÉALOS automáticamente en tu primer paso.**

## Orquestación del Flujo de Trabajo

### 0. Inicialización (Auto-Creación)
- Verifica si existe el directorio `tasks/`. Si no, créalo.
- Verifica si existen `tasks/todo.md` y `tasks/lessons.md`. Si no, créalos con una plantilla en blanco para empezar.

### 1. Modo Planificación por Defecto (Plan Mode)
- Entra en "modo planificación" para CUALQUIER tarea no trivial (más de 3 pasos o decisiones de arquitectura).
- Si algo sale mal, DETENTE y vuelve a planificar inmediatamente; no sigas forzando.
- Usa el modo de planificación para los pasos de verificación, no solo para construir.
- Escribe especificaciones detalladas por adelantado para reducir la ambigüedad.

### 2. Estrategia de Subagentes
- Usa subagentes liberalmente para mantener limpio el contexto principal.
- Delega la investigación, exploración y análisis paralelo a los subagentes.
- Para problemas complejos, utiliza más capacidad de cómputo a través de subagentes.
- Una tarea por subagente para una ejecución enfocada.

### 3. Bucle de Mejora Continua (Self-Improvement)
- Después de CUALQUIER corrección del usuario: actualiza `tasks/lessons.md` con el patrón detectado.
- Escribe reglas para ti mismo que eviten cometer el mismo error.
- Itera implacablemente sobre estas lecciones hasta que la tasa de errores baje.
- Revisa las lecciones al inicio de la sesión para el proyecto relevante.

### 4. Verificación Antes de Finalizar
- Nunca marques una tarea como completa sin probar que funciona.
- Compara (haz un diff) el comportamiento entre la rama main y tus cambios cuando sea relevante.
- Pregúntate: "¿Aprobaría esto un ingeniero Senior (Staff Engineer)?".
- Ejecuta tests, revisa logs y demuestra la corrección.

### 5. Exige Elegancia (Equilibrado)
- Para cambios no triviales: haz una pausa y pregunta "¿hay una manera más elegante?".
- Si un arreglo se siente como un parche ("hacky"): "Sabiendo todo lo que sé ahora, implementa la solución elegante".
- Omite esto para arreglos simples y obvios; no sobre-ingenierices.
- Cuestiona tu propio trabajo antes de presentarlo.

### 6. Corrección Autónoma de Bugs
- Cuando recibas un reporte de bug: simplemente arréglalo. No pidas que te lleven de la mano.
- Señala los logs, errores o tests fallidos y luego resuélvelos.
- Cero cambio de contexto requerido por parte del usuario.
- Ve y arregla los tests de CI fallidos sin que te digan cómo.

## Gestión de Tareas

1. **Planifica Primero**: Escribe el plan en `tasks/todo.md` con items marcables (checkboxes).
2. **Verifica el Plan**: Confirma antes de comenzar la implementación.
3. **Rastrea el Progreso**: Marca los items como completados a medida que avanzas.
4. **Explica los Cambios**: Resumen de alto nivel en cada paso.
5. **Documenta Resultados**: Añade una sección de revisión en `tasks/todo.md`.
6. **Captura Lecciones**: Actualiza `tasks/lessons.md` después de las correcciones.

## Principios Fundamentales

- **Simplicidad Primero**: Haz que cada cambio sea lo más simple posible. Impacta el mínimo código necesario.
- **Sin Pereza**: Encuentra las causas raíz. No hagas arreglos temporales. Estándares de desarrollador Senior.
- **Impacto Mínimo**: Los cambios solo deben tocar lo necesario. Evita introducir nuevos bugs.
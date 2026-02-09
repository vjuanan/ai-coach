# Lecciones Aprendidas

- **SIEMPRE** hacer push a GitHub y verificar en producción cuando el usuario lo solicite, no asumir que la validación local es suficiente para el usuario.
- **Validación con Screenshots**: Utilizar capturas de pantalla de la URL de producción para confirmar que los cambios de UI impactaron correctamente.
- **Estados de React y Remounting**: Cuando un componente depende de una prop de layout que cambia drásticamente el comportamiento (como grid vs list), usar una `key` dinámica para forzar el remount y asegurar que el estado inicial (ej. `isExpanded`) se sincronice correctamente.


- [x] Centralizar el control de estado (como el guardado) en el componente padre (`MesocycleEditor`) facilita la gestión de acciones globales como "Guardar y Salir", en lugar de delegar en componentes hijos (`BlockBuilderPanel`).
- [x] **Crucial**: Al mover elementos UI que usan iconos (como `Zap`) de un componente a otro, SIEMPRE verificar que se han añadido los imports correspondientes en el componente de destino. Un import faltante rompe la compilación silenciosamente en algunos entornos de desarrollo, haciendo que la UI no se actualice y frustre al usuario.
- [x] **Verificación en Producción**: Cuando el usuario reporta que "sigue igual", verificar siempre si se está probando en Local vs Producción. Si es Producción, asegurar que se ha hecho el Push y explicar los tiempos de despliegue.
- [ ] **Persistencia Vercel/Next.js**: A veces, incluso después de un push exitoso, el despliegue automático puede fallar o tardar. Si el usuario sigue sin ver cambios, verificar el estado del despliegue en Vercel o forzar una recompilación.

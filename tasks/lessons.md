# Lecciones Aprendidas

- [x] Centralizar el control de estado (como el guardado) en el componente padre (`MesocycleEditor`) facilita la gestión de acciones globales como "Guardar y Salir", en lugar de delegar en componentes hijos (`BlockBuilderPanel`).
- [x] **Crucial**: Al mover elementos UI que usan iconos (como `Zap`) de un componente a otro, SIEMPRE verificar que se han añadido los imports correspondientes en el componente de destino. Un import faltante rompe la compilación silenciosamente en algunos entornos de desarrollo, haciendo que la UI no se actualice y frustre al usuario.
- [ ] **Verificación en Producción**: Cuando el usuario reporta que "sigue igual", verificar siempre si se está probando en Local vs Producción. Si es Producción, asegurar que se ha hecho el Push y explicar los tiempos de despliegue.

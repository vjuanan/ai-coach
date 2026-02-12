# Lecciones Aprendidas

## 2026-02-09: RLS Policies Bloquean Consultas Cross-Table

**Problema:** El Progression Preview desaparecía después de reload debido a una política RLS que bloqueaba lecturas.

**Causa Raíz:** La política RLS de `workout_blocks` no permitía consultas que necesitaban acceder a bloques a través de múltiples semanas/días dentro del mismo programa. Aunque usamos el admin client en `saveMesocycleChanges`, **las consultas de lectura del frontend** usaban el cliente autenticado regular, que estaba bloqueado por RLS.

**Insight Clave:** 
- Escrituras backend con `adminSupabase` bypasean RLS ✅
- Lecturas frontend con cliente `supabase` regular respetan RLS ⚠️
- Este desajuste causó que los datos se escribieran exitosamente pero fueran invisibles para el usuario al leer

**Patrón de Solución:**
Al crear políticas RLS para tablas relacionadas (programs → mesocycles → days → workout_blocks), asegurar que la política permita leer TODOS los bloques dentro de un programa que el usuario posee, no solo bloques en un único día.

**Estructura de Política Correcta:**
```sql
CREATE POLICY "workout_blocks_select"
    ON workout_blocks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM days d
            JOIN mesocycles m ON d.mesocycle_id = m.id
            JOIN programs p ON m.program_id = p.id
            WHERE d.id = workout_blocks.day_id
            AND (
                p.is_template = true
                OR p.coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
                OR p.client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
            )
        )
    );
```

**Prevención:**
1. Siempre testear políticas RLS con operaciones de lectura y escritura
2. Al usar admin bypass para escrituras, verificar que las lecturas del frontend sigan funcionando
3. Usar logs de consola como "Admin vio X, Usuario vio Y" para detectar desajustes RLS
4. Testear consultas cross-week/cross-day al trabajar con datos jerárquicos

**Archivos de Referencia:**
- Migración: `supabase/migrations/20260209140000_fix_workout_blocks_rls_final.sql`
- Fuente del error: `lib/actions.ts` (función saveMesocycleChanges)

---

- **SIEMPRE** hacer push a GitHub y verificar en producción cuando el usuario lo solicite, no asumir que la validación local es suficiente para el usuario.
- **Validación con Screenshots**: Utilizar capturas de pantalla de la URL de producción para confirmar que los cambios de UI impactaron correctamente.
- **Estados de React y Remounting**: Cuando un componente depende de una prop de layout que cambia drásticamente el comportamiento (como grid vs list), usar una `key` dinámica para forzar el remount y asegurar que el estado inicial (ej. `isExpanded`) se sincronice correctamente.
- [x] Centralizar el control de estado (como el guardado) en el componente padre (`MesocycleEditor`) facilita la gestión de acciones globales como "Guardar y Salir", en lugar de delegar en componentes hijos (`BlockBuilderPanel`).
- [x] **Crucial**: Al mover elementos UI que usan iconos (como `Zap`) de un componente a otro, SIEMPRE verificar que se han añadido los imports correspondientes en el componente de destino. Un import faltante rompe la compilación silenciosamente en algunos entornos de desarrollo, haciendo que la UI no se actualice y frustre al usuario.
- [x] **Verificación en Producción**: Cuando el usuario reporta que "sigue igual", verificar siempre si se está probando en Local vs Producción. Si es Producción, asegurar que se ha hecho el Push y explicar los tiempos de despliegue.
- [x] **Persistencia Vercel/Next.js**: A veces, incluso después de un push exitoso, el despliegue automático puede fallar o tardar. Si el usuario sigue sin ver cambios:
  1. Verificar que `git log` muestra los commit con los cambios
  2. Verificar que `git push` dice "Everything up-to-date"
  3. **Asumir que hay problema con deployment** y notificar inmediatamente al usuario
  4. El usuario debe ir a Vercel Dashboard y forzar un redeploy manual
  5. NUNCA asumir que el cambio está en producción solo porque está en `origin/main`
- [x] **Ambigüedad en Referencias UI**: Cuando el usuario dice "Arriba de todo" o "El header", verificar con precisión a QUÉ elemento se refiere si existen múltiples headers o instancias similares (ej: día en top bar vs día en card header). Pedir clarificación visual o describir ambos para confirmar antes de eliminar código.
- [x] **Store Implementation & Interfaces**: When implementing Zustand stores in TypeScript:
  1. Ensure the Interface definition is completely separate from the implementation.
  2. Verify that **every method** defined in the Interface is actually implemented in the `create` call. Missing implementations cause silent runtime failures or build errors.
  3. If helper functions (like UUID generation) are removed or refactored, ensure their replacements (e.g., `generateTempId`) are defined and available in the scope before use.
- [x] **Propagación de Despliegues**: Al verificar cambios en producción inmediatamente después de un push, es probable que se sirva la versión anterior cachéada. Confiar en la verificación de código (lectura de archivos) si la verificación de navegador falla por contenido obsoleto, y avisar al usuario sobre el tiempo de propagación.

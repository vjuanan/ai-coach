# Plan de Mejora de Diseño: Refactor Visual de Rutina Semanal (Intento 2 - Pixel Perfect)

> El primer intento fue rechazado por parecer "hecho con paint". El objetivo ahora es replicar 1:1 las imágenes de referencia usando CSS exacto y tipografías correctas.

## Fase 1: Estructura y Container (Pixel Perfect)
- [x] Forzar la fuente `Inter` (sans-serif moderno) en todo el contenedor de exportación.
- [x] El contenedor padre debe ser blanco `#FFFFFF`.
- [x] La supersección de "Misión" y "Pausas" debe tener un fondo rosado muy claro `#FFF5F8` que toque los bordes laterales (sangrado completo).

## Fase 2: Cabecera y Misión
- [x] Título "PLAN DE ENTRENAMIENTO" en Burgundy oscuro (`#5B0F2A`), extra bold.
- [x] "GOLD EDITION" píldora con texto dorado claro y borde.
- [x] Bloque "Misión": Fondo blanco, sombra suave (`0 4px 20px rgba(0,0,0,0.05)`), bordes redondeados (8px), borde izquierdo amarillo/dorado (`#F59E0B` 4px). Título en rosa oscuro/magenta.
- [x] Tiempos de pausa: Textos centrados, Burgundy 900 para el tiempo, Rosa para el texto inferior.

## Fase 3: Días y Activación
- [x] Encabezado "DÍA 1": Sangrado completo (toca los bordes del contenedor). Fondo Burgundy `#5B0F2A`, texto blanco.
- [x] Activación: Título dorado `#F59E0B`. Ejercicios como píldoras (border-radius 999px) con fondo rosa ultra claro `#FFF5F8` y borde rosa pálido `#FFE4E6`.

## Fase 4: Tarjetas de Ejercicios y Grid Semanal
- [x] Tarjeta principal: Borde rosa suave `#FBCFE8`, fondo blanco, borde redondeado `12px`, padding amplio (`20px`).
- [x] Numeración y Títulos: Número inline, tamaño `24px` (no gigante), color `#F472B6`. Título oscuro `#111827`, tamaño `18px`.
- [x] Grid de progresión: Flexbox con 4 columnas, fondo rosa pálido `#FFF5F8` (sin bordes obvios), "SEM X" en dorado pequeño, valores en negro.

## Fase 5: Finisher
- [x] Background burgundy (`#5B0F2A`) y border-radius `12px` u `8px`.
- [x] Etiqueta dorada "FINISHER".
- [x] Texto del circuito en blanco (`#ffffff`).

### Fase 6: Formato Móvil y Detalles Creativos Premium
- [x] Convertir contenedor de A4 (`794px`) a diseño Mobile (`430px` de ancho).
- [x] Ajustar todos los paddings globales y locales (de `48px` a `24px` o `32px` máximo).
- [x] Escalar las tipografías masivas para el nuevo layout (ej. Título de 46px a 36px/38px, Pausas, Ejercicios).
- [x] Añadir gradientes sutiles al fondo del encabezado de Título y Días (ej: `linear-gradient` en Burgundy).
- [x] Implementar un efecto "glow" o sombra difuminada en la etiqueta de `GOLD EDITION` y los números de los ejercicios.
- [x] Asegurarse de que el diseño de `Semanas` y `Pausas` acomode bien el espacio reducido sin verse asfixiado (flex y tipografía reducida).
- [x] Añadir una marca de agua/pie de página premium ("Powered by AI Coach" o similar) al final del bloque exportado.

### Fase 7: Refinamiento Creativo y Reducción de Espacios (Mobile)
- [ ] Cambiar el fondo del contenedor principal (detrás de los ejercicios) a un gris/rosa extra-claro (`#FCFAFB`) para que las tarjetas blancas resalten.
- [ ] Ajustar la tarjeta de ejercicio (`ExerciseRow`):
  - Reducir `padding` de `16px` a `12px` y `marginBottom` a `12px` para quitar aire.
  - Eliminar el borde perimetral (`border`) y cambiar a una sombra más estilizada y elegante (`box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05)`).
  - Añadir un "accent-bar" (borde izquierdo sólido colorido) de `4px` en cada tarjeta.
- [ ] Mejorar el diseño del Número del Ejercicio (Ej: añadirle un muy leve `text-shadow` o pasarlo a un color Magenta más profundo con estilo de fuente extra-black).
- [ ] Compactar el grid de "SEM X": reducir `padding` en las celdas y quizás darles un fondo con leve gradiente o borde suave top/bottom para estructurar.
- [x] Achicar tipografías de elementos secundarios (ej. Cues, instrucciones) ligeramente para mejorar la jerarquía en móvil.

### Fase 8: Iteración Fina de Rediseño (Layout Lateral + Ultra Compacto)
*Problema detectado:* La lectura sigue siendo muy vertical (Número -> Título -> Cue -> Semanas), lo cual alarga la tarjeta y genera aire a los costados del número gigante.
**Plan de Acción:**
- [x] **Rediseño del Layout Superior (Flex Horizontal):** Colocar el "Número Gigante" a la izquierda, y a su derecha (en la misma línea vertical) apilar el Título y la Descripción (Cue). Esto ahorrará muchísimo espacio vertical y llenará el hueco a la derecha del número.
- [x] **Título del Ejercicio:** Asegurarnos de que tenga un tamaño legible pero no desproporcionado (ej. 16px font-black).
- [x] **Separación Vertical:** Reducir el gap o margin bottom entre el contenido superior y la grilla de semanas.
- [x] **Grilla de Semanas Mínima:** En lugar de `SEM 1` en naranja sobre el valor, ponerlo al lado o hacerlo súper apaisado para perder menos altura (ej: una tablita ultra condensada).
- [x] **Bordes del Contenedor de Ejercicio:** Acentuar el "floating card" usando un padding de 12px constante alrededor y bordes un poco más filosos (ej: borderRadius 12px en vez de 16px). Opcionalmente añadir un borde izquierdo sólido (`border-left: 4px solid PINK`) como línea de intensidad.

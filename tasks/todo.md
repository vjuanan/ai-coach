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
- [ ] Convertir contenedor de A4 (`794px`) a diseño Mobile (`480px` de ancho).
- [ ] Ajustar todos los paddings globales y locales (de `48px` a `24px` o `32px` máximo).
- [ ] Escalar las tipografías masivas para el nuevo layout (ej. Título de 46px a 36px).
- [ ] Añadir gradientes sutiles al fondo del encabezado de Título y Días (ej: `linear-gradient` en Burgundy).
- [ ] Implementar un efecto "glow" o sombra difuminada en la etiqueta de `GOLD EDITION` y los números de los ejercicios.
- [ ] Asegurarse de que el diseño de `Semanas` y `Pausas` acomode bien el espacio reducido sin verse asfixiado.
- [ ] Añadir una marca de agua/pie de página premium ("Powered by AI Coach" o similar) al final del bloque exportado.

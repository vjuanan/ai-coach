# Lessons Learned

- Always check alignment in export views carefully.
- Flexbox `items-center` is crucial for vertical alignment.
- **html2canvas quirks**: To center text vertically with icons in `html2canvas` exports, precise `line-height` control (often `1` or `1.2`) and explicit flex alignment are necessary. Default browser rendering is more forgiving than the canvas capture.
- **Drag & Drop vs Click**: Al usar bibliotecas como `dnd-kit`, es crucial separar el área de arrastre (handle) del área clickeable principal, especialmente en componentes complejos como tarjetas de bloques. Los listeners de arrastre en el contenedor principal interceptan y cancelan los eventos `onClick`, causando una experiencia de usuario frustrante. Siempre usar un `DragHandle` explícito para estas interacciones.

# Lessons Learned

- Always check alignment in export views carefully.
- Flexbox `items-center` is crucial for vertical alignment.
- **html2canvas quirks**: To center text vertically with icons in `html2canvas` exports, precise `line-height` control (often `1` or `1.2`) and explicit flex alignment are necessary. Default browser rendering is more forgiving than the canvas capture.

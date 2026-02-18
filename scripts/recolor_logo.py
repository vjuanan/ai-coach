from PIL import Image
import os

def recolor_logo(input_path, output_path, target_color_hex):
    try:
        if not os.path.exists(input_path):
            print(f"Error: File not found at {input_path}")
            return

        img = Image.open(input_path)
        img = img.convert("RGBA")
        datas = img.getdata()

        new_data = []
        
        # Parse hex color
        hex_color = target_color_hex.lstrip('#')
        r_target = int(hex_color[0:2], 16)
        g_target = int(hex_color[2:4], 16)
        b_target = int(hex_color[4:6], 16)

        for item in datas:
            # item is (R, G, B, A)
            if item[3] > 0:  # If pixel is not transparent
                # Maintain alpha, change RGB
                new_data.append((r_target, g_target, b_target, item[3]))
            else:
                new_data.append(item)

        img.putdata(new_data)
        img.save(output_path, "PNG")
        print(f"Successfully saved recolored logo to {output_path}")

    except Exception as e:
        print(f"An error occurred: {e}")

# Configuration
input_file = "/Users/juanan/Library/CloudStorage/OneDrive-EPNStore/Team Ventas y Administracion 🤑/AI Deveolpments/AI Coach/public/images/logo-slate.png"
preview_file = "/Users/juanan/.gemini/antigravity/brain/f151bcd0-e5db-4a5d-8bb6-d0d6dc0e7e06/logo_preview_green.png"

# Dark Green Elegant: #0B3D26
recolor_logo(input_file, preview_file, "#0B3D26")

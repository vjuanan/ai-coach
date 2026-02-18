from PIL import Image

def smart_recolor(input_path, output_path, target_color_hex, bg_color_ref=None, threshold=50):
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        datas = img.getdata()
        new_data = []

        # Parse target hex
        hex_color = target_color_hex.lstrip('#')
        r_target = int(hex_color[0:2], 16)
        g_target = int(hex_color[2:4], 16)
        b_target = int(hex_color[4:6], 16)

        # Detect background from corner if not provided
        if bg_color_ref is None:
            bg_color_ref = img.getpixel((0, 0))

        # Helper to check distance
        def is_similar(c1, c2, thresh):
            # c1, c2 are tuples (R,G,B,A)
            # If A is 0, they are similar (transparent)
            if c1[3] == 0 and c2[3] == 0: return True
            if c1[3] != c2[3]: return False # Different alpha = different
            dist = sum(abs(c1[i] - c2[i]) for i in range(3))
            return dist < thresh

        for item in datas:
            # item is (R, G, B, A)
            
            # If it's transparent, keep it transparent
            if item[3] == 0:
                new_data.append(item)
                continue

            # Check if it's part of the background (similar to corner)
            if is_similar(item, bg_color_ref, threshold):
                # It's background, keep it
                new_data.append(item)
            else:
                # It's foreground (the logo), recolor it
                # Preserve alpha of the original pixel (for antialiasing)
                new_data.append((r_target, g_target, b_target, item[3]))

        img.putdata(new_data)
        img.save(output_path, "PNG")
        print(f"Smart recolored {input_path} to {output_path}")

    except Exception as e:
        print(f"Error: {e}")

# Apply to both
# Dark Green Elegant: #0B3D26
target_green = "#0B3D26"

# Recolor logo-slate (assuming white/light background)
smart_recolor("public/images/logo-slate.png", "public/images/logo-slate.png", target_green)

# Recolor logo-white (assuming black/dark/transparent background)
# Wait, for logo-white, if it's transparent, bg_color_ref might be (0,0,0,0).
# If it has a solid background, correct. 
# I will let the script detect the corner.
smart_recolor("public/images/logo-white.png", "public/images/logo-white.png", target_green)

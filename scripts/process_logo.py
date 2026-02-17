from PIL import Image
import os

def process_logo():
    input_path = "public/images/ai-coach-logo-v3.png"
    output_white = "public/images/logo-white.png"
    output_slate = "public/images/logo-slate.png"
    
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        return

    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()
        
        newDataWhite = []
        newDataSlate = []
        
        # Color definitions
        # Slate-700 is approx #334155 -> (51, 65, 85)
        slate_color = (51, 65, 85)
        
        for item in datas:
            # item is (R, G, B, A)
            
            # 1. Detect White Background (approx > 240, 240, 240)
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                # Transparent
                newDataWhite.append((255, 255, 255, 0))
                newDataSlate.append((255, 255, 255, 0))
            else:
                # 2. It's part of the logo
                # Create White Version: Change pixel to White, keep Alpha (or make opaque if it was logo)
                # Note: If the logo has antialiasing, we might want to preserve alpha if it exists.
                # However, original is likely opaque on white.
                
                # Check if it's the GREEN color we want to change?
                # Or just turn EVERYTHING that isn't background into the target color?
                # The user said "change the color".
                # Let's assume the logo matches the icon shape and we want to recolor it entirely.
                
                # White Logo:
                newDataWhite.append((255, 255, 255, item[3]))
                
                # Slate Logo:
                newDataSlate.append((slate_color[0], slate_color[1], slate_color[2], item[3]))

        img_white = Image.new("RGBA", img.size)
        img_white.putdata(newDataWhite)
        img_white.save(output_white, "PNG")
        print(f"Saved {output_white}")
        
        img_slate = Image.new("RGBA", img.size)
        img_slate.putdata(newDataSlate)
        img_slate.save(output_slate, "PNG")
        print(f"Saved {output_slate}")

        # --- Favicon Generation ---
        # Create a Transparent background square
        # Favicon size: 64x64 (or 192x192 for high res)
        # We will make a 192x192 generic icon and a 64x64 favicon
        
        icon_size = (192, 192)
        # Transparent Background
        bg_color = (255, 255, 255, 0)
        
        # Create base
        icon_img = Image.new("RGBA", icon_size, bg_color)
        
        # *** ULTIMATE ZOOM STRATEGY ***
        # 1. Get the tightest bounding box (remove all transparent space)
        bbox = img_slate.getbbox()
        if bbox:
            logo_cropped = img_slate.crop(bbox)
        else:
            logo_cropped = img_slate
            
        print(f"BBox Size: {logo_cropped.size}")
        
        # 2. Scale to COVER the icon size (192x192)
        # This will fill the square completely.
        # Since the logo is wider (718x556), scaling to match height (192) means width will be > 192.
        # This crops the sides (barbell plates) but maximizes the athlete size.
        
        # Calculate scale ratio to ensure BOTH dimensions are at least 192
        ratio_w = icon_size[0] / logo_cropped.width
        ratio_h = icon_size[1] / logo_cropped.height
        scale_ratio = max(ratio_w, ratio_h)
        
        # Add EXTRA 10% zoom as requested ("30% mas grande")
        scale_ratio = scale_ratio * 1.1 
        
        new_width = int(logo_cropped.width * scale_ratio)
        new_height = int(logo_cropped.height * scale_ratio)
        
        logo_resized = logo_cropped.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # 3. Center Crop to fit 192x192
        left = (new_width - icon_size[0]) // 2
        top = (new_height - icon_size[1]) // 2
        right = left + icon_size[0]
        bottom = top + icon_size[1]
        
        logo_final = logo_resized.crop((left, top, right, bottom))
        
        # Paste
        icon_img.paste(logo_final, (0, 0), logo_final)
        
        # Save icon.png (Next.js automatically uses this)
        icon_img.save("public/icon.png", "PNG")
        print("Saved public/icon.png")
        
        # Save favicon.ico (Multi-size)
        icon_img.save("public/favicon.ico", format='ICO', sizes=[(64, 64), (32, 32), (16, 16)])
        print("Saved public/favicon.ico")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    process_logo()

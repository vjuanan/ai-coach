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
        
        # Resize logo to fit inside (with padding)
        # We'll use the SLATE logo for the icon so it's visible on light tabs.
        # (Most browser tabs are light).
        
        target_logo_width = int(icon_size[0] * 0.9) # Make it bigger since no bg padding needed
        ratio = target_logo_width / img.width
        target_logo_height = int(img.height * ratio)
        
        # Resize the SLATE version
        logo_resized = img_slate.resize((target_logo_width, target_logo_height), Image.Resampling.LANCZOS)
        
        # Center the logo
        offset = ((icon_size[0] - target_logo_width) // 2, (icon_size[1] - target_logo_height) // 2)
        
        # Paste logo onto background
        icon_img.paste(logo_resized, offset, logo_resized)
        
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

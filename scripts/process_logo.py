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

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    process_logo()

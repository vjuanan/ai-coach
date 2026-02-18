from PIL import Image

def analyze_image(path):
    try:
        img = Image.open(path)
        img = img.convert("RGBA")
        width, height = img.size
        
        corner = img.getpixel((0, 0))
        center = img.getpixel((width // 2, height // 2))
        
        print(f"File: {path}")
        print(f"Size: {width}x{height}")
        print(f"Corner pixel (0,0): {corner}")
        print(f"Center pixel: {center}")
        
        # Check if corner is transparent
        if corner[3] == 0:
            print("Corner is transparent.")
        else:
            print("Corner is NOT transparent.")
            
    except Exception as e:
        print(f"Error: {e}")

analyze_image("public/images/logo-white.png")

import os
from PIL import Image

def resize_icon(input_path, output_path, scale_factor=0.7):
    try:
        img = Image.open(input_path).convert("RGBA")
        original_width, original_height = img.size
        
        # Calculate new dimensions
        new_width = int(original_width * scale_factor)
        new_height = int(original_height * scale_factor)
        
        # Resize the image content
        resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Create a new transparent image with original dimensions
        new_img = Image.new("RGBA", (original_width, original_height), (0, 0, 0, 0))
        
        # Paste the resized image onto the center of the new image
        x_offset = (original_width - new_width) // 2
        y_offset = (original_height - new_height) // 2
        new_img.paste(resized_img, (x_offset, y_offset))
        
        # Save the result
        new_img.save(output_path)
        print(f"Resized {input_path} to {output_path} with scale factor {scale_factor}")
        return new_img
    except Exception as e:
        print(f"Error resizing icon: {e}")
        return None

def generate_ico(img, output_path):
    try:
        if img:
            img.save(output_path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
            print(f"Generated {output_path}")
    except Exception as e:
        print(f"Error generating ICO: {e}")

if __name__ == "__main__":
    base_dir = os.getcwd()
    public_dir = os.path.join(base_dir, 'public')
    icon_path = os.path.join(public_dir, 'icon.png')
    logo_slate_path = os.path.join(public_dir, 'images', 'logo-slate.png')
    backup_path = os.path.join(public_dir, 'icon_backup_final.png')
    
    # Backup original icon if it exists
    if os.path.exists(icon_path):
        import shutil
        shutil.copy2(icon_path, backup_path)
        print(f"Backed up {icon_path} to {backup_path}")

    # Use logo-slate.png as source if it exists, otherwise fall back to icon.png
    source_path = logo_slate_path if os.path.exists(logo_slate_path) else icon_path
    
    if os.path.exists(source_path):
        # Resize and overwrite icon.png with the new source content
        resized_img = resize_icon(source_path, icon_path)
        
        # Generate favicon.ico
        favicon_path = os.path.join(public_dir, 'favicon.ico')
        generate_ico(resized_img, favicon_path)
    else:
        print(f"Source file not found at {source_path}")

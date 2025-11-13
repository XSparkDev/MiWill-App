#!/usr/bin/env python3
"""
Generate all required iOS app icons from a source image.
"""
from pathlib import Path
from PIL import Image
import json

def generate_ios_icons():
    source = Path("assets/appstorelogo.png")
    if not source.exists():
        print(f"❌ Source image not found: {source}")
        return False
    
    # Create output directory
    target_dir = Path("ios_app_icons")
    target_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"📱 Generating iOS app icons from {source}...")
    
    # All required iOS icon sizes
    # Format: (base_size, scales, idiom)
    icon_specs = [
        # iPhone sizes
        ("20x20", [2, 3], "iphone"),
        ("29x29", [2, 3], "iphone"),
        ("40x40", [2, 3], "iphone"),
        ("60x60", [2, 3], "iphone"),
        # iPad sizes
        ("20x20", [1, 2], "ipad"),
        ("29x29", [1, 2], "ipad"),
        ("40x40", [1, 2], "ipad"),
        ("76x76", [1, 2], "ipad"),
        ("83.5x83.5", [2], "ipad"),
        # App Store
        ("1024x1024", [1], "ios-marketing"),
    ]
    
    # Open source image
    image = Image.open(source).convert("RGBA")
    
    contents_images = []
    generated_count = 0
    
    for base_size, scales, idiom in icon_specs:
        base_w, base_h = map(float, base_size.replace("x", " ").split())
        
        for scale in scales:
            width = int(base_w * scale)
            height = int(base_h * scale)
            
            # Generate filename
            if scale == 1:
                filename = f"icon-{base_size}.png"
            else:
                filename = f"icon-{base_size}@{scale}x.png"
            
            # Resize and save
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            output_path = target_dir / filename
            resized.save(output_path, "PNG")
            
            print(f"  ✓ Generated {filename} ({width}x{height})")
            generated_count += 1
            
            # Add to Contents.json
            contents_images.append({
                "size": base_size,
                "idiom": idiom,
                "filename": filename,
                "scale": f"{scale}x"
            })
    
    # Generate Contents.json
    contents = {
        "images": contents_images,
        "info": {
            "version": 1,
            "author": "xcode"
        }
    }
    
    contents_path = target_dir / "Contents.json"
    with open(contents_path, 'w') as f:
        json.dump(contents, f, indent=2)
    
    print(f"\n✅ Generated {generated_count} icon sizes")
    print(f"📁 Icons saved to: {target_dir.absolute()}")
    print(f"📄 Contents.json created")
    
    return True

if __name__ == "__main__":
    try:
        success = generate_ios_icons()
        exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)




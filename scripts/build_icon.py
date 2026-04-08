"""
Build app icon (ICO) from logo PNG for PyInstaller. Embeds in exe; no separate file at runtime.
Run from project root. Writes app_icon.ico next to this script.
"""
import os
import sys

def main():
    try:
        from PIL import Image
    except ImportError:
        print("Install Pillow for icon build: pip install Pillow", file=sys.stderr)
        sys.exit(1)

    root = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(root, "assets", "vrchat legends", "vrchat_legends_logo_round.png"),
        os.path.join(root, "assets", "vrchat", "9_Paws.png"),
        os.path.join(root, "frontend", "public", "assets", "vrchat legends", "vrchat_legends_logo_round.png"),
        os.path.join(root, "logo.png"),
    ]
    src = None
    for p in candidates:
        if os.path.isfile(p):
            src = p
            break
    if not src:
        print("No logo PNG found. Tried:", candidates, file=sys.stderr)
        sys.exit(1)

    img = Image.open(src)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGBA")
    else:
        img = img.convert("RGB")

    # ICO needs multiple sizes; Windows uses 16, 32, 48, 256
    sizes = [(16, 16), (32, 32), (48, 48), (256, 256)]
    out_path = os.path.join(root, "app_icon.ico")
    img.save(out_path, format="ICO", sizes=sizes)
    print("Wrote", out_path)
    return 0

if __name__ == "__main__":
    sys.exit(main())

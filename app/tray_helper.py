"""System tray: run in background when the main window is closed."""
import os
import sys
import threading

_tray_icon = None


def _resolve_icon_path():
    if getattr(sys, "frozen", False):
        base = getattr(sys, "_MEIPASS", "")
        for name in ("app_icon.ico", "app_icon.png"):
            p = os.path.join(base, name)
            if os.path.isfile(p):
                return p
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for name in ("app_icon.ico",):
        p = os.path.join(root, name)
        if os.path.isfile(p):
            return p
    return None


def _load_tray_image():
    path = _resolve_icon_path()
    if not path:
        return None
    try:
        from PIL import Image
        return Image.open(path)
    except Exception:
        return None


def start_tray(window_factory, on_show=None):
    """
    Start tray icon in a daemon thread. window_factory is a callable that returns
    the current pywebview window (or None). on_show is called when user opens from tray.
    """
    global _tray_icon
    try:
        import pystray
        from pystray import Menu, MenuItem
    except ImportError:
        return False

    image = _load_tray_image()
    if image is None:
        try:
            from PIL import Image, ImageDraw
            image = Image.new("RGBA", (64, 64), (107, 70, 193, 255))
            d = ImageDraw.Draw(image)
            d.ellipse((8, 8, 56, 56), fill=(255, 0, 122, 255))
        except Exception:
            return False

    def show_app(icon, _):
        w = window_factory()
        if w is not None:
            try:
                w.show()
            except Exception:
                pass
        if on_show:
            try:
                on_show()
            except Exception:
                pass

    def exit_app(icon, _):
        try:
            icon.stop()
        except Exception:
            pass
        for w in _webview_windows():
            try:
                w.destroy()
            except Exception:
                pass
        os._exit(0)

    menu = Menu(
        MenuItem("Open VRChat Legends Group Tool", show_app, default=True),
        MenuItem("Exit", exit_app),
    )

    _tray_icon = pystray.Icon(
        "vrchat_legends_group_tool",
        image,
        "VRChat Legends Group Tool — running in tray (click Open to show the window)",
        menu,
    )

    def run_tray():
        _tray_icon.run()

    t = threading.Thread(target=run_tray, daemon=True)
    t.start()
    return True


def _webview_windows():
    try:
        import webview
        return list(webview.windows)
    except Exception:
        return []

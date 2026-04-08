"""
First-run installer when the frozen exe is not yet in an install location
(Inno Setup leaves unins000.exe; portable copy leaves .vrlgtool_installed).
"""
import os
import shutil
import subprocess
import sys
APP_FOLDER_NAME = "VRChat Legends Group Tool"
EXE_NAME = "VRChat Legends Group Tool.exe"
MARKER_NAME = ".vrlgtool_installed"
INNO_UNINSTALL_NAMES = ("unins000.exe", "unins001.exe")


def _default_install_dir():
    if sys.platform == "win32":
        base = os.environ.get("APPDATA") or os.path.join(
            os.environ.get("USERPROFILE", ""), "AppData", "Roaming"
        )
        return os.path.join(base, APP_FOLDER_NAME)
    return os.path.join(os.path.expanduser("~"), "." + APP_FOLDER_NAME.replace(" ", "_"))


def _install_dir_has_marker_or_inno(install_dir):
    if not install_dir or not os.path.isdir(install_dir):
        return False
    marker = os.path.join(install_dir, MARKER_NAME)
    if os.path.isfile(marker):
        return True
    for name in INNO_UNINSTALL_NAMES:
        if os.path.isfile(os.path.join(install_dir, name)):
            return True
    return False


def _needs_bootstrap():
    if not getattr(sys, "frozen", False):
        return False
    if os.environ.get("VRLG_SKIP_INSTALLER", "").strip() in ("1", "true", "yes"):
        return False
    install_dir = os.path.dirname(os.path.abspath(sys.executable))
    return not _install_dir_has_marker_or_inno(install_dir)


def _create_desktop_shortcut(target_exe):
    if sys.platform != "win32":
        return
    try:
        desktop = os.path.join(os.environ.get("USERPROFILE", ""), "Desktop")
        lnk = os.path.join(desktop, f"{APP_FOLDER_NAME}.lnk")
        ps = (
            "$exe=$args[0]; $lnk=$args[1]; "
            "$WshShell = New-Object -ComObject WScript.Shell; "
            "$s = $WshShell.CreateShortcut($lnk); $s.TargetPath = $exe; $s.Save()"
        )
        subprocess.run(
            ["powershell", "-NoProfile", "-Command", ps, target_exe, lnk],
            capture_output=True,
            timeout=15,
            creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, "CREATE_NO_WINDOW") else 0,
        )
    except Exception:
        pass


def _write_marker(install_dir):
    path = os.path.join(install_dir, MARKER_NAME)
    try:
        with open(path, "w", encoding="utf-8") as f:
            f.write("1\n")
    except OSError:
        pass


def _ensure_dirs(install_dir):
    for sub in ("frontend", "data"):
        try:
            os.makedirs(os.path.join(install_dir, sub), exist_ok=True)
        except OSError:
            pass


def _run_tk_wizard():
    import tkinter as tk
    from tkinter import filedialog, messagebox, ttk

    result = {"ok": False, "path": None, "shortcut": True}

    root = tk.Tk()
    root.title("Install — VRChat Legends Group Tool")
    root.resizable(True, False)
    root.minsize(520, 280)
    bg = "#0a0a0a"
    fg = "#e5e5e5"
    accent = "#6b46c1"
    root.configure(bg=bg)

    default_dir = _default_install_dir()
    path_var = tk.StringVar(value=default_dir)
    shortcut_var = tk.BooleanVar(value=True)

    outer = tk.Frame(root, bg=bg, padx=20, pady=16)
    outer.pack(fill=tk.BOTH, expand=True)

    tk.Label(
        outer,
        text="Install VRChat Legends Group Tool",
        font=("Segoe UI", 14, "bold"),
        fg="#ffffff",
        bg=bg,
    ).pack(anchor=tk.W)

    tk.Label(
        outer,
        text="Choose where to install the app. Data and updates will be stored in this folder.",
        font=("Segoe UI", 9),
        fg="#9ca3af",
        bg=bg,
        wraplength=480,
        justify=tk.LEFT,
    ).pack(anchor=tk.W, pady=(8, 12))

    row = tk.Frame(outer, bg=bg)
    row.pack(fill=tk.X, pady=(0, 8))
    entry = ttk.Entry(row, textvariable=path_var, width=52)
    entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 8))

    def browse():
        p = filedialog.askdirectory(initialdir=path_var.get() or default_dir, title="Select install folder")
        if p:
            path_var.set(p)

    ttk.Button(row, text="Browse…", command=browse).pack(side=tk.RIGHT)

    cb = tk.Checkbutton(
        outer,
        text="Create a desktop shortcut",
        variable=shortcut_var,
        fg=fg,
        bg=bg,
        selectcolor="#1a1a1a",
        activebackground=bg,
        activeforeground=fg,
        font=("Segoe UI", 9),
    )
    cb.pack(anchor=tk.W, pady=(8, 16))

    btn_row = tk.Frame(outer, bg=bg)
    btn_row.pack(fill=tk.X, pady=(8, 0))

    def do_install():
        target = path_var.get().strip()
        if not target:
            messagebox.showerror("Install", "Please choose an install folder.", parent=root)
            return
        try:
            os.makedirs(target, exist_ok=True)
        except OSError as e:
            messagebox.showerror("Install", f"Cannot create folder:\n{e}", parent=root)
            return
        dest_exe = os.path.join(target, EXE_NAME)
        src = os.path.abspath(sys.executable)
        if os.path.normcase(src) == os.path.normcase(dest_exe):
            _write_marker(target)
            _ensure_dirs(target)
            result["ok"] = True
            result["path"] = target
            result["shortcut"] = shortcut_var.get()
            root.destroy()
            return
        try:
            if os.path.isfile(dest_exe):
                os.replace(dest_exe, dest_exe + ".old")
            shutil.copy2(src, dest_exe)
        except OSError as e:
            messagebox.showerror("Install", f"Could not copy the app:\n{e}", parent=root)
            return
        _ensure_dirs(target)
        _write_marker(target)
        if shortcut_var.get():
            _create_desktop_shortcut(dest_exe)
        result["ok"] = True
        result["path"] = target
        result["shortcut"] = shortcut_var.get()
        root.destroy()

    def do_cancel():
        root.destroy()

    install_btn = tk.Button(
        btn_row,
        text="Install",
        command=do_install,
        bg=accent,
        fg="#ffffff",
        activebackground="#805ad5",
        activeforeground="#ffffff",
        font=("Segoe UI", 10, "bold"),
        padx=20,
        pady=6,
        relief=tk.FLAT,
        cursor="hand2",
    )
    install_btn.pack(side=tk.RIGHT, padx=(8, 0))

    cancel_btn = tk.Button(
        btn_row,
        text="Cancel",
        command=do_cancel,
        bg="#262626",
        fg=fg,
        activebackground="#404040",
        font=("Segoe UI", 10),
        padx=16,
        pady=6,
        relief=tk.FLAT,
    )
    cancel_btn.pack(side=tk.RIGHT)

    root.update_idletasks()
    w = root.winfo_width()
    h = root.winfo_height()
    sw = root.winfo_screenwidth()
    sh = root.winfo_screenheight()
    root.geometry(f"+{(sw - w) // 2}+{(sh - h) // 2}")

    root.mainloop()
    return result


def ensure_installed_via_wizard():
    """
    If the frozen exe is running from a non-install location, show the wizard.
    Returns True to continue startup, False if user cancelled (process should exit).
    """
    if not _needs_bootstrap():
        return True

    r = _run_tk_wizard()
    if not r["ok"]:
        return False

    dest_exe = os.path.join(r["path"], EXE_NAME)
    current = os.path.normcase(os.path.abspath(sys.executable))
    if os.path.normcase(dest_exe) != current:
        try:
            subprocess.Popen([dest_exe], cwd=r["path"], close_fds=True)
        except OSError:
            pass
        return False
    return True

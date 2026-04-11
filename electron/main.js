/**
 * VRChat Legends Group Tool – Electron main process
 *
 * This wrapper:
 *   1. Spawns the Python Flask backend
 *   2. Waits for the backend to be ready on port 5555
 *   3. Opens a frameless BrowserWindow showing http://127.0.0.1:5555
 *   4. Forwards IPC messages for native window controls (minimize/maximize/close)
 *
 * Development usage:
 *   cd electron && npm install && npm start
 *   (Python must be on PATH and activated venv if needed)
 *
 * Packaged builds:
 *   electron-builder will bundle this together with the Python EXE.
 */

const { app, BrowserWindow, ipcMain, shell, screen, Tray, Menu, nativeImage, Notification } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const BACKEND_PORT = 5555;
const VITE_PORT = 5173;
const isDev = !app.isPackaged;
let mainWindow = null;
let pythonProcess = null;
let tray = null;

// ─── Single instance lock ─────────────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to launch a second instance — focus the existing window
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ─── Backend health-check ─────────────────────────────────────────────────────
function waitForServer(port, maxAttempts = 80, interval = 400) {
  const host = port === VITE_PORT ? 'localhost' : '127.0.0.1';
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      const req = http.get(`http://${host}:${port}`, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (++attempts >= maxAttempts) {
          reject(new Error(`Server on port ${port} did not start within the timeout.`));
        } else {
          setTimeout(check, interval);
        }
      });
      req.setTimeout(600, () => req.destroy());
    };
    check();
  });
}

// ─── Python backend ───────────────────────────────────────────────────────────
function startPythonBackend() {
  const env = { ...process.env };

  if (app.isPackaged) {
    // Packaged: Python EXE bundled alongside Electron
    const exePath = path.join(process.resourcesPath, 'VRChat Legends Group Tool.exe');
    pythonProcess = spawn(exePath, [], { env, detached: false, windowsHide: true });
  } else {
    // Development: run the Python source script
    const scriptPath = path.join(__dirname, '..', 'vrchat_auto_accept.py');
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    pythonProcess = spawn(pythonCmd, [scriptPath], {
      env,
      cwd: path.join(__dirname, '..'),
      detached: false,
      windowsHide: true,
    });
  }

  if (pythonProcess.stdout) {
    pythonProcess.stdout.on('data', (d) => process.stdout.write(`[python] ${d}`));
  }
  if (pythonProcess.stderr) {
    pythonProcess.stderr.on('data', (d) => process.stderr.write(`[python:err] ${d}`));
  }
  pythonProcess.on('exit', (code) => console.log(`[python] exited with code ${code}`));
}

// ─── Window creation ──────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 920,
    minHeight: 620,
    center: true,
    frame: false,           // Custom title bar
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0a0a',
    icon: path.join(__dirname, '..', 'assets', 'branding', 'group_tool_icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true,
    },
    show: false,
  });

  mainWindow.loadURL(isDev ? `http://localhost:${VITE_PORT}` : `http://127.0.0.1:${BACKEND_PORT}`);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Show the window immediately when ready (not hidden to tray)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('maximize-change', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('maximize-change', false);
  });

  // Close to tray instead of quitting
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
      // Show a notification the first time
      if (!app._trayNoticeShown && Notification.isSupported()) {
        new Notification({
          title: 'VRChat Legends Group Tool',
          body: 'Still running in the background. Right-click the tray icon to quit.',
          icon: path.join(__dirname, '..', 'assets', 'branding', 'group_tool_icon.png'),
        }).show();
        app._trayNoticeShown = true;
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── System tray ──────────────────────────────────────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, '..', 'assets', 'branding', 'group_tool_icon.png');
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('VRChat Legends Group Tool — running');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  startPythonBackend();
  createTray();

  try {
    // Always wait for the Python backend (APIs)
    await waitForServer(BACKEND_PORT);
    console.log('[electron] Backend is ready.');

    // In dev mode, also wait for the Vite dev server
    if (isDev) {
      console.log('[electron] Waiting for Vite dev server...');
      await waitForServer(VITE_PORT, 60, 500);
      console.log('[electron] Vite dev server is ready.');
    }
  } catch (err) {
    console.error('[electron]', err.message);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('window-all-closed', () => {
  // Don't quit — we keep running in tray. Only quit if app.isQuitting is set.
  if (app.isQuitting) {
    if (pythonProcess) {
      try { pythonProcess.kill('SIGTERM'); } catch {}
    }
    if (process.platform !== 'darwin') app.quit();
  }
});

// ─── Window control IPC ───────────────────────────────────────────────────────
ipcMain.on('window-minimize', () => mainWindow?.minimize());

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => mainWindow?.close());

ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false);

// Open external URLs in the system browser (not Electron)
ipcMain.on('open-external', (_, url) => {
  shell.openExternal(url).catch(console.error);
});

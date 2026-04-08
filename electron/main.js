/**
 * VRChat Legends Group Tool – Electron main process
 *
 * This wrapper:
 *   1. Spawns the Python Flask backend (sets ELECTRON_MODE=1 to suppress pywebview)
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

const { app, BrowserWindow, ipcMain, shell, screen } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const BACKEND_PORT = 5555;
let mainWindow = null;
let pythonProcess = null;

// ─── Backend health-check ─────────────────────────────────────────────────────
function waitForBackend(maxAttempts = 80, interval = 400) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      const req = http.get(`http://127.0.0.1:${BACKEND_PORT}`, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (++attempts >= maxAttempts) {
          reject(new Error('Python backend did not start within the timeout.'));
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
  const env = { ...process.env, ELECTRON_MODE: '1' };

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
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  const winW = Math.min(1440, Math.round(sw * 0.88));
  const winH = Math.min(900, Math.round(sh * 0.90));

  mainWindow = new BrowserWindow({
    width: winW,
    height: winH,
    minWidth: 920,
    minHeight: 620,
    center: true,
    frame: false,           // Custom title bar
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0a0a',
    icon: path.join(__dirname, '..', 'app_icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  });

  mainWindow.loadURL(`http://127.0.0.1:${BACKEND_PORT}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('maximize-change', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('maximize-change', false);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  startPythonBackend();

  try {
    await waitForBackend();
    console.log('[electron] Backend is ready.');
  } catch (err) {
    console.error('[electron]', err.message);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (pythonProcess) {
    try {
      pythonProcess.kill('SIGTERM');
    } catch {}
  }
  if (process.platform !== 'darwin') app.quit();
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

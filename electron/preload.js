/**
 * Electron preload – exposes a safe "electronAPI" bridge to the renderer.
 * All calls go through contextBridge so contextIsolation stays enabled.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // Window controls
  minimize:    () => ipcRenderer.send('window-minimize'),
  maximize:    () => ipcRenderer.send('window-maximize'),
  close:       () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // Open a URL in the system browser
  openExternal: (url) => ipcRenderer.send('open-external', url),

  // Listen for maximize/unmaximize events from main
  onMaximizeChange: (callback) => {
    const listener = (_, isMax) => callback(isMax);
    ipcRenderer.on('maximize-change', listener);
    // Return a cleanup function
    return () => ipcRenderer.removeListener('maximize-change', listener);
  },
});

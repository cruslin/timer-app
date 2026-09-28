// Lets the page hand a downloaded update to the shell (see main.js).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('timerDesktop', {
  saveUpdate: (version, html) => ipcRenderer.invoke('save-update', version, html),
});

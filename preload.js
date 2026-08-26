const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('casaAllegraDesktop', {
  isDesktop: true,
  getAutoStart: () => ipcRenderer.invoke('get-autostart'),
  setAutoStart: (enabled) => ipcRenderer.invoke('set-autostart', Boolean(enabled))
});

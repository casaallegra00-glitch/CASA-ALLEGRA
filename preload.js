const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('casaAllegraDesktop', {
  isDesktop: true,
  getAutoStart: () => ipcRenderer.invoke('get-autostart'),
  setAutoStart: (enabled) => ipcRenderer.invoke('set-autostart', Boolean(enabled))
});

contextBridge.exposeInMainWorld('casaAllegraAI', {
  hasKey: () => ipcRenderer.invoke('ai-has-key'),
  setKey: (key) => ipcRenderer.invoke('ai-set-key', String(key || '')),
  chat: (payload) => ipcRenderer.invoke('ai-chat', payload)
});

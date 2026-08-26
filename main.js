const { app, BrowserWindow, shell, Menu, session, ipcMain } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: '#f7f4ff',
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icons', 'icon-512.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
      spellcheck: true,
      devTools: isDev
    }
  });

  win.once('ready-to-show', () => win.show());

  // Keep the app native: external sites (especially WhatsApp) open in the default browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^(https?:|mailto:|tel:)/i.test(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    const current = win.webContents.getURL();
    const sameLocalApp = url.startsWith('file://') || url === current;
    if (!sameLocalApp) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Slightly stricter permissions for a local business app.
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = new Set(['notifications', 'clipboard-read', 'clipboard-sanitized-write']);
    callback(allowed.has(permission));
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  if (process.platform === 'win32' && app.isPackaged) {
    app.setLoginItemSettings({
      openAtLogin: true,
      name: 'CASA ALLEGRA'
    });
  }

  ipcMain.handle('get-autostart', () => {
    if (process.platform !== 'win32') return false;
    return app.getLoginItemSettings({ name: 'CASA ALLEGRA' }).openAtLogin;
  });

  ipcMain.handle('set-autostart', (_event, enabled) => {
    if (process.platform !== 'win32') return false;
    app.setLoginItemSettings({
      openAtLogin: Boolean(enabled),
      name: 'CASA ALLEGRA',
      enabled: true
    });
    return app.getLoginItemSettings({ name: 'CASA ALLEGRA' }).openAtLogin;
  });

  const template = [
    {
      label: 'CASA ALLEGRA',
      submenu: [
        { label: 'Recargar', accelerator: 'CmdOrCtrl+R', click: (_m, w) => w?.reload() },
        { type: 'separator' },
        { role: 'quit', label: 'Salir de CASA ALLEGRA' }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'resetZoom', label: 'Tamaño normal' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla completa' }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Abrir carpeta de datos',
          click: () => shell.openPath(app.getPath('userData'))
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

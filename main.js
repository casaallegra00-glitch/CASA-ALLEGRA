const { app, BrowserWindow, shell, Menu, session, ipcMain, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

const isDev = !app.isPackaged;

function securePath(name) { return path.join(app.getPath('userData'), name); }
function readSecure(name) {
  try {
    const raw = JSON.parse(fs.readFileSync(securePath(name), 'utf8'));
    if (raw.encrypted && safeStorage.isEncryptionAvailable()) return safeStorage.decryptString(Buffer.from(raw.encrypted, 'base64'));
  } catch {}
  return '';
}
function writeSecure(name, value) {
  if (!value) { try { fs.rmSync(securePath(name), { force: true }); } catch {} return true; }
  if (!safeStorage.isEncryptionAvailable()) throw new Error('El cifrado seguro de Windows no está disponible en este equipo.');
  const encrypted = safeStorage.encryptString(value).toString('base64');
  fs.writeFileSync(securePath(name), JSON.stringify({ encrypted }), 'utf8');
  return true;
}
function readAIKey(){return readSecure('ai-key.json');}
function saveAIKey(key){return writeSecure('ai-key.json',key);}
function readMPToken(){return readSecure('mercadopago-token.json');}
function saveMPToken(token){return writeSecure('mercadopago-token.json',token);}
function mpRequest(pathname, params='') {
  return new Promise((resolve,reject)=>{
    const token=readMPToken();
    if(!token) return reject(new Error('Configurá primero tu Access Token de Mercado Pago.'));
    const req=https.request({hostname:'api.mercadopago.com',path:`${pathname}${params}`,method:'GET',headers:{Authorization:`Bearer ${token}`,Accept:'application/json'}},res=>{
      let data='';res.setEncoding('utf8');res.on('data',c=>data+=c);res.on('end',()=>{try{const json=JSON.parse(data);if(res.statusCode<200||res.statusCode>=300)return reject(new Error(json?.message||json?.error||`Mercado Pago devolvió HTTP ${res.statusCode}.`));resolve(json)}catch{return reject(new Error('Respuesta inválida de Mercado Pago.'))}});
    });
    req.on('error',e=>reject(new Error(`No se pudo conectar con Mercado Pago: ${e.message}`)));req.setTimeout(30000,()=>req.destroy(new Error('La consulta a Mercado Pago tardó demasiado.')));req.end();
  });
}
function askOpenAI({ apiKey, model, message, context }) {
  return new Promise((resolve, reject) => {
    const instructions = `Sos el asistente de gestión de CASA ALLEGRA, un negocio argentino de papelería y gráfica creativa. Respondé en español rioplatense, de forma clara, práctica y profesional. Ayudá con costos, precios, márgenes, catálogo, ventas, presupuestos, pedidos, stock, ideas, organización y métricas. No inventes datos del negocio: usá únicamente el contexto proporcionado y marcá cuando falte información. Cuando des recomendaciones comerciales, separá hechos de sugerencias. Contexto actual de CASA ALLEGRA:\n${JSON.stringify(context || {}, null, 2)}`;
    const body = JSON.stringify({ model: model || 'gpt-5', instructions, input: message, max_output_tokens: 900 });
    const req = https.request({ hostname: 'api.openai.com', path: '/v1/responses', method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, res => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode < 200 || res.statusCode >= 300) { reject(new Error(json?.error?.message || `OpenAI devolvió HTTP ${res.statusCode}.`)); return; }
          const text = json.output_text || (json.output || []).flatMap(item => Array.isArray(item.content) ? item.content : []).filter(part => part.type === 'output_text' && typeof part.text === 'string').map(part => part.text).join('\n');
          resolve(text || 'La IA no devolvió texto.');
        } catch { reject(new Error('Respuesta inválida del servicio de IA.')); }
      });
    });
    req.on('error', err => reject(new Error(`No se pudo conectar con OpenAI: ${err.message}`)));
    req.setTimeout(30000, () => req.destroy(new Error('La solicitud a la IA tardó demasiado.')));
    req.write(body); req.end();
  });
}
function createWindow() {
  const win = new BrowserWindow({ width: 1440, height: 920, minWidth: 1024, minHeight: 720, backgroundColor: '#f7f4ff', show: false, autoHideMenuBar: true, icon: path.join(__dirname, 'icons', 'icon-512.png'), webPreferences: { contextIsolation: true, nodeIntegration: false, preload: path.join(__dirname, 'preload.js'), sandbox: true, spellcheck: true, devTools: isDev } });
  win.once('ready-to-show', () => win.show());
  win.webContents.on('did-finish-load', () => {
    const files = ['casa-allegra-enhancements.js','casa-allegra-ai.js','casa-allegra-store.js','casa-allegra-pagos-envios.js'];
    const paths = files.map(name => `file://${path.join(__dirname, name).replace(/\\/g, '/')}`);
    win.webContents.executeJavaScript(`(() => { for (const src of ${JSON.stringify(paths)}) { const s=document.createElement('script'); s.src=src; document.body.appendChild(s); } })();`).catch(() => {});
  });
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^(https?:|mailto:|tel:)/i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (event, url) => { const current = win.webContents.getURL(); const sameLocalApp = url.startsWith('file://') || url === current; if (!sameLocalApp) { event.preventDefault(); shell.openExternal(url); } });
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => callback(new Set(['notifications','clipboard-read','clipboard-sanitized-write']).has(permission)));
  win.loadFile(path.join(__dirname, 'index.html'));
}
app.whenReady().then(() => {
  if (process.platform === 'win32' && app.isPackaged) app.setLoginItemSettings({ openAtLogin: true, name: 'CASA ALLEGRA' });
  ipcMain.handle('get-autostart', () => process.platform === 'win32' ? app.getLoginItemSettings({ name: 'CASA ALLEGRA' }).openAtLogin : false);
  ipcMain.handle('set-autostart', (_event, enabled) => { if (process.platform !== 'win32') return false; app.setLoginItemSettings({ openAtLogin: Boolean(enabled), name: 'CASA ALLEGRA', enabled: true }); return app.getLoginItemSettings({ name: 'CASA ALLEGRA' }).openAtLogin; });
  ipcMain.handle('ai-has-key', () => Boolean(readAIKey()));
  ipcMain.handle('ai-set-key', (_event, key) => { saveAIKey(String(key || '').trim()); return true; });
  ipcMain.handle('ai-chat', async (_event, payload = {}) => { const apiKey = readAIKey(); if (!apiKey) throw new Error('Configurá primero tu clave de OpenAI en ⚙ del Asistente IA.'); const message = String(payload.message || '').trim(); if (!message) throw new Error('Escribí una consulta.'); return askOpenAI({ apiKey, model: payload.model || 'gpt-5', message, context: payload.context || {} }); });
  ipcMain.handle('mp-has-token', () => Boolean(readMPToken()));
  ipcMain.handle('mp-set-token', (_event, token) => { saveMPToken(String(token || '').trim()); return true; });
  ipcMain.handle('mp-list-payments', async () => { const r=await mpRequest('/v1/payments/search','?sort=date_created&criteria=desc&range=date_created&begin_date=2020-01-01T00:00:00.000-03:00&end_date='+encodeURIComponent(new Date().toISOString())+'&limit=30'); return r.results||[]; });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'CASA ALLEGRA', submenu: [{ label: 'Recargar', accelerator: 'CmdOrCtrl+R', click: (_m, w) => w?.reload() }, { type: 'separator' }, { role: 'quit', label: 'Salir de CASA ALLEGRA' }] },
    { label: 'Ver', submenu: [{ role: 'resetZoom', label: 'Tamaño normal' }, { role: 'zoomIn', label: 'Acercar' }, { role: 'zoomOut', label: 'Alejar' }, { type: 'separator' }, { role: 'togglefullscreen', label: 'Pantalla completa' }] },
    { label: 'Ayuda', submenu: [{ label: 'Abrir carpeta de datos', click: () => shell.openPath(app.getPath('userData')) }] }
  ]));
  createWindow(); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

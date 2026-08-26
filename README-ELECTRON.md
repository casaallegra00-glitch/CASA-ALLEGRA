# CASA ALLEGRA — Desktop Electron

Versión nativa de escritorio para Windows 10/11 x64.

## Características
- Ventana de escritorio independiente.
- Tu logo de CASA ALLEGRA.
- Catálogo, costos, precios, presupuestos, pedidos, ideas y configuración.
- Datos guardados localmente en el equipo.
- Botones de WhatsApp abren el navegador predeterminado.
- Menú nativo de CASA ALLEGRA y controles de zoom/pantalla completa.
- Instalador NSIS `.exe` y versión portable.

## Crear el instalador en Windows
1. Descarga y descomprime esta carpeta.
2. Haz doble clic en `build_windows.bat`.
3. El script instala Node.js LTS si hace falta (mediante winget), descarga Electron y electron-builder y crea el instalador.
4. El resultado queda en `dist\\CASA-ALLEGRA-Setup-1.0.0-x64.exe`.

## Ejecutar durante desarrollo
Con Node.js instalado:
`npm install`
`npm start`

## Notas
El instalador no está firmado digitalmente. Windows puede mostrar una advertencia de SmartScreen al ejecutar el `.exe` hasta que se distribuya con un certificado de firma de código.

La aplicación conserva los datos en el almacenamiento de usuario de Electron. En caso de desinstalar, se conserva la carpeta de datos porque `deleteAppDataOnUninstall` está desactivado.

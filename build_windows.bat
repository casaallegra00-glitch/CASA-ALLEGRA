@echo off
setlocal
cd /d "%~dp0"
if not exist package.json (
  echo ERROR: No se encuentra package.json. Extrae el ZIP completo antes de ejecutar este archivo.
  pause
  exit /b 1
)
where node >nul 2>&1 || (echo ERROR: Falta Node.js LTS. Instala Node.js y vuelve a ejecutar.&pause&exit /b 1)
call npm install
if errorlevel 1 (echo ERROR: npm install fallo.&pause&exit /b 1)
call npm run dist
if errorlevel 1 (echo ERROR: No se pudo crear el instalador.&pause&exit /b 1)
if not exist dist\CASA-ALLEGRA-Setup-1.1.0-x64.exe (echo ERROR: No se encontro el EXE final.&pause&exit /b 1)
echo INSTALADOR LISTO: dist\CASA-ALLEGRA-Setup-1.1.0-x64.exe
pause

@echo off
cd /d "%~dp0"
where py >nul 2>&1 && (start "CASA ALLEGRA" http://localhost:8080 && py -m http.server 8080) || (start "CASA ALLEGRA" http://localhost:8080 && python -m http.server 8080)

@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PYTHON=py"
set "PYARGS=-3"
:dependencias
"%PYTHON%" %PYARGS% -c "import serial" 2>nul || "%PYTHON%" %PYARGS% -m pip install -r requirements.txt
start "" http://127.0.0.1:8080
"%PYTHON%" %PYARGS% cco_server.py
pause

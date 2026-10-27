@echo off
cd /d "%~dp0"
net session >nul 2>&1
if errorlevel 1 (
  echo Execute este arquivo como Administrador:
  echo clique com o botao direito -^> "Executar como administrador".
  pause
  exit /b 1
)
netsh advfirewall firewall delete rule name="CCO Ferrovia UDP 4210" >nul 2>&1
netsh advfirewall firewall add rule name="CCO Ferrovia UDP 4210" dir=in action=allow protocol=UDP localport=4210
netsh advfirewall firewall delete rule name="CCO Ferrovia TCP 8080" >nul 2>&1
netsh advfirewall firewall add rule name="CCO Ferrovia TCP 8080" dir=in action=allow protocol=TCP localport=8080
echo.
echo Regras de firewall criadas: UDP 4210 ^(telemetria^) e TCP 8080 ^(interface^).
pause

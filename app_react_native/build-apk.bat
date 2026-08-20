@echo off
echo ========================================
echo  Build APK Standalone - Maquete Truck
echo ========================================
echo.
echo Passo 1: Verificar EAS CLI...
eas --version
if %errorlevel% neq 0 (
    echo EAS CLI nao encontrado. Instalando...
    npm install -g eas-cli
)
echo.
echo Passo 2: Login no Expo (se necessario)
eas whoami
if %errorlevel% neq 0 (
    echo Faca login: eas login
    eas login
)
echo.
echo Passo 3: Build APK (preview)
echo Isso vai compilar na nuvem do Expo e gerar um link para download
echo.
eas build --platform android --profile preview
echo.
echo ========================================
echo  O APK sera disponibilizado via link
echo  Baixe e instale no celular
echo ========================================
pause

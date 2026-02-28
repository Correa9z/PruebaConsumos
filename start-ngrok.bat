@echo off
echo ================================================
echo   WompiTest - Tunel ngrok para Backend
echo ================================================
echo.
echo Expone el backend (puerto 3001) para recibir:
echo   - Webhook de pago (POST /api/webhooks/payment)
echo   - Redirect tras el pago (GET /api/payments/wompi-redirect)
echo.

where ngrok >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\ngrok\ngrok.exe" (
        set "NGROK_BIN=C:\ngrok\ngrok.exe"
    ) else (
        echo ERROR: ngrok no encontrado. Instala desde https://ngrok.com/download
        pause
        exit /b 1
    )
) else (
    set "NGROK_BIN=ngrok"
)

set "CONFIG=%~dp0ngrok.yml"
if not exist "%CONFIG%" (
    echo ERROR: No se encuentra %CONFIG%
    pause
    exit /b 1
)

echo Iniciando tunel backend -^> 3001...
"%NGROK_BIN%" start backend --config="%CONFIG%"

pause

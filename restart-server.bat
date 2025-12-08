@echo off
chcp 65001 >nul
title Reiniciar Servidor 55PBX
color 0B

echo ========================================
echo    Reiniciando Servidor 55PBX
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Parando processos Node.js na porta 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo   Encerrando processo PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo [OK] Processos encerrados
echo.

echo [2/3] Verificando Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js não encontrado!
    pause
    exit /b 1
)
echo [OK] Node.js encontrado
echo.

echo [3/3] Iniciando servidor...
echo.
echo ========================================
echo    SERVIDOR INICIADO
echo ========================================
echo.
echo O servidor está rodando na porta 3000
echo Abra o navegador em: http://localhost:3000
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

node server.js

pause


@echo off
chcp 65001 >nul
title ETL 55PBX - Teste de API
color 0E

echo ========================================
echo    ETL 55PBX - TESTE DE API
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Verificando Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js não encontrado!
    pause
    exit /b 1
)
echo [OK] Node.js encontrado
echo.

echo [2/3] Verificando arquivo .env...
if not exist ".env" (
    echo [ERRO] Arquivo .env não encontrado!
    pause
    exit /b 1
)
echo [OK] Arquivo .env encontrado
echo.

echo [3/3] Iniciando servidor de teste...
echo.
echo ========================================
echo    SERVIDOR DE TESTE INICIADO
echo ========================================
echo.
echo O servidor está rodando na porta 3000
echo Abra o navegador em: http://localhost:3000
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

node server.js

pause


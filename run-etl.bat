@echo off
chcp 65001 >nul
title ETL 55PBX
color 0A

echo ========================================
echo    ETL 55PBX - Execução Automática
echo ========================================
echo.

cd /d "%~dp0"

echo Verificando Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js não encontrado!
    pause
    exit /b 1
)

echo Verificando arquivo .env...
if not exist ".env" (
    echo [ERRO] Arquivo .env não encontrado!
    pause
    exit /b 1
)

echo.
echo Executando ETL...
echo.
node index.js
set ETL_EXIT_CODE=%errorlevel%

if %ETL_EXIT_CODE% neq 0 (
    echo.
    echo [ERRO] ETL falhou com código: %ETL_EXIT_CODE%
    pause
    exit /b %ETL_EXIT_CODE%
)


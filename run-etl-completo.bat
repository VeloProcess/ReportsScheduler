@echo off
chcp 65001 >nul
title ETL 55PBX - Execução Completa
color 0A

echo ========================================
echo    ETL 55PBX - Execução Completa
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Verificando Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js não encontrado!
    echo Por favor, instale o Node.js: https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js encontrado
echo.

echo [2/3] Verificando arquivo .env...
if not exist ".env" (
    echo [ERRO] Arquivo .env não encontrado!
    echo Por favor, crie o arquivo .env com as configurações necessárias.
    pause
    exit /b 1
)
echo [OK] Arquivo .env encontrado
echo.

echo [3/3] Executando ETL...
echo.
node index.js
set ETL_EXIT_CODE=%errorlevel%

echo.
echo ========================================
if %ETL_EXIT_CODE% equ 0 (
    echo    ETL EXECUTADO COM SUCESSO!
    echo ========================================
    echo.
    echo Os dados foram salvos nas planilhas do Google Sheets.
    echo Verifique as planilhas para confirmar.
) else (
    echo    ERRO AO EXECUTAR ETL
    echo ========================================
    echo.
    echo Código de erro: %ETL_EXIT_CODE%
    echo Verifique os logs acima para mais detalhes.
    echo.
    echo Possíveis causas:
    echo - Credenciais incorretas no arquivo .env
    echo - Problema de conexão com a API 55PBX
    echo - Problema de conexão com Google Sheets
    echo - Erro nas configurações das planilhas
)
echo.
pause
exit /b %ETL_EXIT_CODE%


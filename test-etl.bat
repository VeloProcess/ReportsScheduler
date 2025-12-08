@echo off
chcp 65001 >nul
title ETL 55PBX - Teste
color 0B

echo ========================================
echo    ETL 55PBX - TESTE DE EXTRAÇÃO
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Verificando Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js não encontrado!
    echo Por favor, instale o Node.js: https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js encontrado
echo.

echo [2/4] Verificando arquivo .env...
if not exist ".env" (
    echo [ERRO] Arquivo .env não encontrado!
    echo Por favor, crie o arquivo .env com as configurações necessárias.
    pause
    exit /b 1
)
echo [OK] Arquivo .env encontrado
echo.

echo [3/4] Verificando dependências...
if not exist "node_modules" (
    echo [AVISO] node_modules não encontrado. Instalando dependências...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao instalar dependências!
        pause
        exit /b 1
    )
    echo [OK] Dependências instaladas
) else (
    echo [OK] Dependências encontradas
)
echo.

echo [4/4] Executando teste de extração...
echo.
echo ========================================
echo    INICIANDO TESTE
echo ========================================
echo.
echo O teste irá:
echo - Buscar dados do Report_02 (Chamadas)
echo - Buscar dados do Report_04 (Pausas)
echo - Salvar nas planilhas do Google Sheets
echo.
echo Aguarde...
echo.

node index.js
set ETL_EXIT_CODE=%errorlevel%

echo.
echo ========================================
if %ETL_EXIT_CODE% equ 0 (
    echo    TESTE CONCLUÍDO COM SUCESSO!
    echo ========================================
    echo.
    echo Os dados foram extraídos e salvos nas planilhas.
    echo Verifique as planilhas do Google Sheets para confirmar.
) else (
    echo    ERRO NO TESTE
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
    echo - Período sem dados disponíveis
)
echo.
pause
exit /b %ETL_EXIT_CODE%


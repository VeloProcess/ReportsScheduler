# Como Agendar o ETL no Windows

Este guia mostra como configurar o Windows Task Scheduler para executar o ETL automaticamente todos os dias às 7h da manhã.

## Pré-requisitos

1. Node.js instalado e funcionando
2. Arquivo `.env` configurado corretamente
3. Script `run-etl.bat` funcionando (teste executando manualmente)

## Passo a Passo

### 1. Testar o Script Manualmente

Primeiro, teste se o script funciona:

1. Abra o PowerShell ou CMD
2. Navegue até a pasta do projeto
3. Execute: `.\test-etl.bat`
4. Verifique se os dados foram salvos nas planilhas

### 2. Abrir o Agendador de Tarefas

1. Pressione `Win + R`
2. Digite: `taskschd.msc`
3. Pressione Enter

### 3. Criar Nova Tarefa

1. No painel direito, clique em **"Criar Tarefa..."**
2. Na aba **Geral**:
   - **Nome**: `ETL 55PBX Diário`
   - **Descrição**: `Executa ETL diário para buscar dados do 55PBX e salvar no Google Sheets`
   - Marque: **"Executar se o usuário estiver conectado ou não"**
   - Marque: **"Executar com privilégios mais altos"**

### 4. Configurar Gatilho (Quando Executar)

1. Vá para a aba **Gatilhos**
2. Clique em **Novo...**
3. Configure:
   - **Iniciar a tarefa**: `Em um agendamento`
   - **Configurações**: `Diariamente`
   - **Hora**: `07:00:00`
   - **Repetir a cada**: `1 dias`
4. Clique em **OK**

### 5. Configurar Ação (O Que Executar)

1. Vá para a aba **Ações**
2. Clique em **Novo...**
3. Configure:
   - **Ação**: `Iniciar um programa`
   - **Programa/script**: Clique em **Procurar...** e selecione o arquivo `run-etl.bat` na pasta do projeto
   - **Iniciar em**: Digite o caminho completo da pasta do projeto (ex: `C:\Users\VelotaxSUP\OneDrive\Documentos\55PBX DADOS`)
4. Clique em **OK**

### 6. Configurar Condições (Opcional)

Na aba **Condições**:
- Desmarque: **"Iniciar a tarefa somente se o computador estiver conectado à energia CA"** (se quiser que rode mesmo na bateria)
- Marque: **"Acordar o computador para executar esta tarefa"** (se quiser que o PC acorde às 7h)

### 7. Salvar e Testar

1. Clique em **OK** para salvar a tarefa
2. Clique com botão direito na tarefa criada
3. Selecione **Executar** para testar
4. Verifique se os dados foram salvos nas planilhas

## Verificar Logs

Para verificar se a tarefa está executando corretamente:

1. No Agendador de Tarefas, encontre sua tarefa
2. Clique com botão direito → **Histórico**
3. Verifique se há execuções bem-sucedidas ou erros

## Solução de Problemas

### A tarefa não executa

1. Verifique se o Node.js está no PATH do sistema
2. Teste executar `run-etl.bat` manualmente
3. Verifique as permissões da pasta do projeto
4. Veja o histórico da tarefa para erros

### Erro "não é possível iniciar"

1. Verifique o caminho do arquivo `.bat` está correto
2. Verifique o caminho em "Iniciar em" está correto
3. Tente usar caminho completo do Node.js no `.bat`:
   ```batch
   @echo off
   cd /d "%~dp0"
   "C:\Program Files\nodejs\node.exe" index.js
   ```

### Dados não aparecem nas planilhas

1. Execute `test-etl.bat` manualmente para ver erros
2. Verifique se o arquivo `.env` está configurado
3. Verifique se as credenciais do Google estão corretas
4. Verifique se as planilhas existem e têm permissão de escrita

## Desativar/Reativar

- **Desativar**: Clique com botão direito na tarefa → **Desabilitar**
- **Reativar**: Clique com botão direito na tarefa → **Habilitar**


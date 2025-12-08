# 🔧 Guia de Configuração - Reports 55PBX

## ✅ Checklist de Configuração

### 1. 📦 Dependências Instaladas
```bash
npm install
```
**Status:** ✅ Já instalado (node_modules existe)

---

### 2. 🔑 Arquivo .env (OBRIGATÓRIO)

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# ============================================
# 55PBX API - Credenciais
# ============================================
PBX_TOKEN=seu_token_bearer_aqui

# ============================================
# Google Sheets - IDs das Planilhas
# ============================================
SHEET_CHAMADAS_ID=1E0g74VvzL37imBG5_elMixGUllLNNnudIUl2-Nd9xyw
SHEET_PAUSAS_ID=1qKxg4hfGXiizW3nkO1rryXbcjVR681PtuE-bN8ADfRY

# ============================================
# Google Service Account - Credenciais
# ============================================
GOOGLE_SERVICE_ACCOUNT_EMAIL=seu-email@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ============================================
# 55PBX API - Parâmetros Opcionais
# (Deixe vazio para buscar todos)
# ============================================
PBX_QUEUE=
PBX_NUMBER=
PBX_AGENT=
PBX_QUIZ_ID=
PBX_TIMEZONE=America/Sao_Paulo
```

---

### 3. 🔐 Como Obter o PBX_TOKEN (55PBX)

1. Acesse o painel administrativo do 55PBX
2. Vá em **Configurações** > **API** ou **Integrações**
3. Gere ou copie o **Bearer Token** da API
4. Cole no `.env` em `PBX_TOKEN=`

**⚠️ Se não souber onde encontrar:**
- Entre em contato com o suporte do 55PBX
- Ou verifique a documentação da API deles

---

### 4. 📊 Como Configurar Google Service Account

#### Passo 1: Criar Projeto no Google Cloud
1. Acesse: https://console.cloud.google.com/
2. Clique em **"Criar Projeto"** ou selecione um existente
3. Dê um nome ao projeto (ex: "55PBX ETL")

#### Passo 2: Ativar API do Google Sheets
1. No menu lateral, vá em **"APIs e Serviços"** > **"Biblioteca"**
2. Procure por **"Google Sheets API"**
3. Clique e depois em **"Ativar"**

#### Passo 3: Criar Service Account
1. Vá em **"IAM e administração"** > **"Contas de serviço"**
2. Clique em **"Criar conta de serviço"**
3. Preencha:
   - **Nome:** 55PBX ETL
   - **ID:** 55pbx-etl (ou outro de sua escolha)
   - Clique em **"Criar e continuar"**
4. **Pule** a etapa de permissões (não precisa)
5. Clique em **"Concluir"**

#### Passo 4: Gerar Chave JSON
1. Clique na Service Account criada
2. Vá na aba **"Chaves"**
3. Clique em **"Adicionar chave"** > **"Criar nova chave"**
4. Selecione **JSON**
5. Baixe o arquivo JSON

#### Passo 5: Extrair Credenciais do JSON
Abra o arquivo JSON baixado e você verá algo assim:

```json
{
  "type": "service_account",
  "project_id": "seu-projeto",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "55pbx-etl@seu-projeto.iam.gserviceaccount.com",
  ...
}
```

**Copie para o `.env`:**
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` = valor de `client_email`
- `GOOGLE_PRIVATE_KEY` = valor de `private_key` (mantenha as aspas e os `\n`)

#### Passo 6: Compartilhar Planilhas com a Service Account
1. Abra a planilha de **Chamadas** no Google Sheets
2. Clique em **"Compartilhar"** (botão no canto superior direito)
3. Cole o email da Service Account (o `client_email`)
4. Dê permissão de **"Editor"**
5. Repita o processo para a planilha de **Pausas**

---

### 5. ✅ Verificar Configuração

Após configurar tudo, teste:

```bash
npm run dev
```

Acesse: http://localhost:3001

Na aba **"Testes de Conexão"**:
1. Teste a conexão com 55PBX
2. Teste a conexão com Google Sheets

Se ambos funcionarem, está tudo configurado! ✅

---

## 🐛 Problemas Comuns

### Erro: "PBX_TOKEN não configurado"
- Verifique se o arquivo `.env` existe na raiz do projeto
- Verifique se o token está correto (sem espaços extras)

### Erro: "Google Sheets não encontrado"
- Verifique se compartilhou as planilhas com o email da Service Account
- Verifique se o ID da planilha está correto no `.env`

### Erro: "Private Key inválida"
- Certifique-se de que a `GOOGLE_PRIVATE_KEY` está entre aspas duplas
- Mantenha os `\n` no texto (não converta para quebras de linha reais)

### Porta em uso
- Se a porta 3001 também estiver em uso, altere no `server.js` (linha 12)

---

## 📝 Resumo Rápido

**Você precisa de:**
1. ✅ Token Bearer do 55PBX → `PBX_TOKEN`
2. ✅ Service Account do Google → `GOOGLE_SERVICE_ACCOUNT_EMAIL` e `GOOGLE_PRIVATE_KEY`
3. ✅ Compartilhar as 2 planilhas com o email da Service Account
4. ✅ Criar arquivo `.env` com todas as variáveis

**Depois disso, pode testar!** 🚀


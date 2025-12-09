# 🚀 Guia de Deploy no Vercel

## Configuração para Vercel

### 1. Variáveis de Ambiente no Vercel

Configure as seguintes variáveis de ambiente no painel do Vercel:

```
PBX_TOKEN=seu_token_aqui
SHEET_CHAMADAS_ID=1E0g74VvzL37imBG5_elMixGUllLNNnudIUl2-Nd9xyw
SHEET_PAUSAS_ID=1qKxg4hfGXiizW3nkO1rryXbcjVR681PtuE-bN8ADfRY
GOOGLE_SERVICE_ACCOUNT_EMAIL=seu-email@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
PBX_QUEUE=
PBX_NUMBER=
PBX_AGENT=
PBX_QUIZ_ID=
PBX_TIMEZONE=America/Sao_Paulo
NODE_ENV=production
```

### 2. Como Configurar no Vercel

1. Acesse seu projeto no Vercel
2. Vá em **Settings** > **Environment Variables**
3. Adicione cada variável uma por uma
4. **IMPORTANTE**: Para `GOOGLE_PRIVATE_KEY`, mantenha as aspas e os `\n`

### 3. Build Command

O Vercel detectará automaticamente o `package.json` e usará:
- **Build Command**: `npm install` (automático)
- **Output Directory**: Não necessário (serverless)

### 4. Arquivo vercel.json

O arquivo `vercel.json` já está configurado para:
- Roteamento correto das rotas `/api/*`
- Servir arquivos estáticos da pasta `public`
- Configurar o ambiente como produção

### 5. Deploy

```bash
# Via CLI
vercel

# Ou faça push para o GitHub (se conectado)
git push origin main
```

## ⚠️ Limitações do Ambiente Serverless

1. **Scheduler**: Não funciona em ambiente serverless. Use Vercel Cron Jobs ou GitHub Actions
2. **Logs em arquivo**: Logs não são salvos em arquivo, apenas no console
3. **Histórico**: O histórico pode não persistir entre execuções (use banco de dados)

## 🔧 Solução de Problemas

### Erro 500

1. Verifique se todas as variáveis de ambiente estão configuradas
2. Verifique os logs no Vercel Dashboard > Deployments > Logs
3. Certifique-se de que `GOOGLE_PRIVATE_KEY` está com aspas e `\n`

### Scheduler não funciona

O scheduler não funciona em ambiente serverless. Use:
- **Vercel Cron Jobs** (recomendado)
- **GitHub Actions** (já configurado)
- **Serviço externo** (ex: cron-job.org)

## 📝 Exemplo de Vercel Cron Job

Crie um arquivo `vercel.json` com:

```json
{
  "crons": [{
    "path": "/api/scheduler/run",
    "schedule": "0 0 * * *"
  }]
}
```

Isso executará o ETL diariamente às 00:00 UTC.


# 🧪 Teste Rápido de Notificações

## ⚡ Teste Rápido (Sem Configuração)

Para testar se o sistema está funcionando sem configurar email/webhook:

```bash
node test-notifications.js
```

Isso vai executar os testes e mostrar se há erros. Se as configurações não estiverem no `.env`, as notificações serão puladas silenciosamente.

## 📧 Teste com Email (Gmail)

### 1. Configure o `.env`:

```env
NOTIFICATIONS_ENABLED=true
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app
EMAIL_FROM=seu-email@gmail.com
EMAIL_TO=destinatario@email.com
EMAIL_ON_SUCCESS=true  # Para testar, ative para receber emails de sucesso também
```

### 2. Obtenha Senha de Aplicativo do Gmail:

1. Acesse: https://myaccount.google.com/apppasswords
2. Selecione "Email" e "Outro (nome personalizado)"
3. Digite "ETL 55PBX"
4. Clique em "Gerar"
5. Copie a senha de 16 caracteres
6. Cole no `EMAIL_PASS` do `.env`

### 3. Execute o teste:

```bash
node test-notifications.js
```

### 4. Verifique seu email!

## 🔗 Teste com Webhook (Slack)

### 1. Crie um Webhook no Slack:

1. Acesse: https://api.slack.com/apps
2. Crie um novo app ou use um existente
3. Vá em "Incoming Webhooks"
4. Ative "Activate Incoming Webhooks"
5. Clique em "Add New Webhook to Workspace"
6. Escolha o canal
7. Copie a URL do webhook

### 2. Configure o `.env`:

```env
NOTIFICATIONS_ENABLED=true
WEBHOOK_ENABLED=true
WEBHOOK_URL=https://hooks.slack.com/services/SEU/WEBHOOK/URL
```

### 3. Execute o teste:

```bash
node test-notifications.js
```

### 4. Verifique o canal do Slack!

## 🎯 Teste Real (Execução Manual do ETL)

Para testar com uma execução real:

1. Configure as notificações no `.env`
2. Acesse o dashboard: http://localhost:3000
3. Clique em "Executar Agora" no controle do scheduler
4. Verifique email/webhook após alguns segundos

## ✅ O que Esperar

### Email de Sucesso:
- Assunto: `✅ ETL 55PBX - SUCESSO - [data/hora]`
- Conteúdo: Período processado, duração, quantidades processadas

### Email de Erro:
- Assunto: `❌ ETL 55PBX - ERRO - [data/hora]`
- Conteúdo: Mesmas informações + lista de erros

### Webhook:
- Payload JSON com todas as informações da execução
- Formato compatível com Slack, Discord, Teams, etc.

## 🐛 Troubleshooting

### "Email não configurado ou desabilitado"
- Verifique se `NOTIFICATIONS_ENABLED=true` e `EMAIL_ENABLED=true`
- Confirme que `EMAIL_TO` está preenchido

### "Nenhum destinatário de email configurado"
- Adicione `EMAIL_TO=seu-email@exemplo.com` no `.env`

### "URL do webhook não configurada"
- Adicione `WEBHOOK_URL=...` no `.env`

### Erro de autenticação Gmail
- Use senha de aplicativo, não a senha normal
- Verifique se a autenticação de 2 fatores está ativa

## 📝 Notas

- As notificações são enviadas de forma assíncrona
- Se uma notificação falhar, o erro é logado mas não interrompe o ETL
- Emails de sucesso só são enviados se `EMAIL_ON_SUCCESS=true`
- Erros sempre geram notificações


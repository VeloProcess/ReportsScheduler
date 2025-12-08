import nodemailer from 'nodemailer';
import axios from 'axios';
import logger from './logger.js';
import dotenv from 'dotenv';

dotenv.config();

// Configurações de notificação
const NOTIFICATIONS_ENABLED = process.env.NOTIFICATIONS_ENABLED === 'true';
const EMAIL_ENABLED = process.env.EMAIL_ENABLED === 'true';
const WEBHOOK_ENABLED = process.env.WEBHOOK_ENABLED === 'true';

// Configurações de Email
const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_SECURE = process.env.EMAIL_SECURE === 'true';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
const EMAIL_TO = process.env.EMAIL_TO ? process.env.EMAIL_TO.split(',').map(e => e.trim()) : [];

// Configurações de Webhook
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Cria transporter de email (lazy initialization)
let emailTransporter = null;

/**
 * Inicializa o transporter de email
 */
function initEmailTransporter() {
  if (!EMAIL_ENABLED || !EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    logger.warn('Email não configurado ou desabilitado');
    return null;
  }

  if (!emailTransporter) {
    emailTransporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_SECURE,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });
  }

  return emailTransporter;
}

/**
 * Envia notificação por email
 */
async function sendEmail(subject, htmlBody, textBody = null) {
  if (!NOTIFICATIONS_ENABLED || !EMAIL_ENABLED) {
    logger.debug('Notificações por email desabilitadas');
    return { success: false, reason: 'Email desabilitado' };
  }

  if (!EMAIL_TO || EMAIL_TO.length === 0) {
    logger.warn('Nenhum destinatário de email configurado');
    return { success: false, reason: 'Nenhum destinatário configurado' };
  }

  try {
    const transporter = initEmailTransporter();
    if (!transporter) {
      return { success: false, reason: 'Transporter não inicializado' };
    }

    const mailOptions = {
      from: EMAIL_FROM,
      to: EMAIL_TO.join(', '),
      subject: subject,
      html: htmlBody,
      text: textBody || htmlBody.replace(/<[^>]*>/g, '') // Remove HTML tags para texto simples
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Email enviado com sucesso', { messageId: info.messageId, to: EMAIL_TO });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Erro ao enviar email', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envia notificação por webhook
 */
async function sendWebhook(payload) {
  if (!NOTIFICATIONS_ENABLED || !WEBHOOK_ENABLED) {
    logger.debug('Notificações por webhook desabilitadas');
    return { success: false, reason: 'Webhook desabilitado' };
  }

  if (!WEBHOOK_URL) {
    logger.warn('URL do webhook não configurada');
    return { success: false, reason: 'URL não configurada' };
  }

  try {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (WEBHOOK_SECRET) {
      headers['X-Webhook-Secret'] = WEBHOOK_SECRET;
    }

    const response = await axios.post(WEBHOOK_URL, payload, {
      headers,
      timeout: 10000 // 10 segundos
    });

    logger.info('Webhook enviado com sucesso', { 
      url: WEBHOOK_URL, 
      status: response.status 
    });
    return { success: true, status: response.status };
  } catch (error) {
    logger.error('Erro ao enviar webhook', {
      url: WEBHOOK_URL,
      error: error.message,
      status: error.response?.status
    });
    return { success: false, error: error.message };
  }
}

/**
 * Notifica sobre execução do ETL
 */
async function notifyETLExecution(execution) {
  if (!NOTIFICATIONS_ENABLED) {
    return;
  }

  const { success, startTime, endTime, duration, chamadasCount, pausasCount, errors, periodProcessed } = execution;

  const emoji = success ? '✅' : '❌';
  const status = success ? 'SUCESSO' : 'ERRO';
  const color = success ? '#4CAF50' : '#f44336';

  // Prepara payload para webhook
  const webhookPayload = {
    event: 'etl_execution',
    timestamp: new Date().toISOString(),
    status: success ? 'success' : 'error',
    execution: {
      startTime: startTime instanceof Date ? startTime.toISOString() : startTime,
      endTime: endTime instanceof Date ? endTime.toISOString() : endTime,
      duration: duration,
      periodProcessed: periodProcessed,
      chamadasCount: chamadasCount || 0,
      pausasCount: pausasCount || 0,
      errors: errors || []
    }
  };

  // Envia webhook
  await sendWebhook(webhookPayload);

  // Envia email apenas em caso de erro ou se configurado para sempre
  const EMAIL_ON_SUCCESS = process.env.EMAIL_ON_SUCCESS === 'true';
  
  if (!success || EMAIL_ON_SUCCESS) {
    const subject = `${emoji} ETL 55PBX - ${status} - ${new Date().toLocaleString('pt-BR')}`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .stat { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
          .stat-label { font-weight: bold; }
          .error { color: #f44336; background: #ffebee; padding: 10px; border-radius: 4px; margin-top: 10px; }
          .success { color: #4CAF50; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${emoji} ETL 55PBX - ${status}</h2>
            <p>Execução: ${new Date(startTime).toLocaleString('pt-BR')}</p>
          </div>
          <div class="content">
            <div class="stat">
              <span class="stat-label">Período Processado:</span>
              <span>${periodProcessed || 'N/A'}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Duração:</span>
              <span>${duration ? `${(duration / 1000).toFixed(2)}s` : 'N/A'}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Chamadas Processadas:</span>
              <span class="${success ? 'success' : ''}">${chamadasCount || 0}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Pausas Processadas:</span>
              <span class="${success ? 'success' : ''}">${pausasCount || 0}</span>
            </div>
            ${errors && errors.length > 0 ? `
              <div class="error">
                <strong>Erros encontrados:</strong>
                <ul>
                  ${errors.map(e => `<li>${e}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            ${success ? '<p style="color: #4CAF50; margin-top: 20px;"><strong>✅ Execução concluída com sucesso!</strong></p>' : ''}
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(subject, htmlBody);
  }
}

/**
 * Notifica sobre erro crítico
 */
async function notifyCriticalError(error, context = {}) {
  if (!NOTIFICATIONS_ENABLED) {
    return;
  }

  const webhookPayload = {
    event: 'critical_error',
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      stack: error.stack,
      context: context
    }
  };

  await sendWebhook(webhookPayload);

  const subject = `🚨 ERRO CRÍTICO - ETL 55PBX - ${new Date().toLocaleString('pt-BR')}`;
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f44336; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #ffebee; padding: 20px; border-radius: 0 0 8px 8px; }
        .error-box { background: white; padding: 15px; border-left: 4px solid #f44336; margin-top: 15px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🚨 Erro Crítico no ETL 55PBX</h2>
          <p>${new Date().toLocaleString('pt-BR')}</p>
        </div>
        <div class="content">
          <div class="error-box">
            <h3>Erro:</h3>
            <p><strong>${error.message}</strong></p>
            ${context && Object.keys(context).length > 0 ? `
              <h4>Contexto:</h4>
              <pre>${JSON.stringify(context, null, 2)}</pre>
            ` : ''}
            ${error.stack ? `
              <h4>Stack Trace:</h4>
              <pre>${error.stack}</pre>
            ` : ''}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(subject, htmlBody);
}

export { notifyETLExecution, notifyCriticalError, sendEmail, sendWebhook };


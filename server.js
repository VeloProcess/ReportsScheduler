import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' })); // Aumenta limite para 50MB
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));


// Importa funções do index.js
import { fetchPBXData, transformChamadasData, transformPausasData } from './index.js';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import axios from 'axios';

// Importa funções do scheduler
import { startScheduler, stopScheduler, getSchedulerStatus, runManual, timeToCron } from './scheduler/scheduler.js';
import logger from './utils/logger.js';
import { getHistory, getStats } from './utils/history.js';

// Configurações
const PBX_BASE_URL = 'https://reportapi02.55pbx.com:50500/api/pbx/reports/metrics';
const PBX_TOKEN = process.env.PBX_TOKEN;
const SHEET_CHAMADAS_ID = process.env.SHEET_CHAMADAS_ID;
const SHEET_PAUSAS_ID = process.env.SHEET_PAUSAS_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const PBX_QUEUE = process.env.PBX_QUEUE || 'all_queues';
const PBX_NUMBER = process.env.PBX_NUMBER || 'all_numbers';
const PBX_AGENT = process.env.PBX_AGENT || 'all_agent';
const PBX_QUIZ_ID = process.env.PBX_QUIZ_ID || 'undefined';
const PBX_TIMEZONE = process.env.PBX_TIMEZONE || '-3';

/**
 * Formata data para o padrão esperado pela API 55PBX
 * Formato: "Fri May 22 2020 00:00:00 GMT -0300"
 * @param {Date} date - Data a formatar
 * @returns {string} Data formatada e codificada para URL
 */
function formatDateForAPI(date) {
  // A API espera formato exato: "Mon Oct 5 2020 00:00:00 GMT -0300"
  // Formato: "Day Mon DD YYYY HH:MM:SS GMT -0300"
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Converte para timezone de Brasília (-03:00)
  // A data vem em UTC, precisamos converter para BRT
  const brtOffset = -3 * 60; // -3 horas em minutos
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const brtDate = new Date(utc + (brtOffset * 60000));
  
  const day = days[brtDate.getDay()];
  const month = months[brtDate.getMonth()];
  const dateNum = brtDate.getDate(); // Dia do mês (1-31)
  const year = brtDate.getFullYear();
  const hours = String(brtDate.getHours()).padStart(2, '0');
  const minutes = String(brtDate.getMinutes()).padStart(2, '0');
  const seconds = String(brtDate.getSeconds()).padStart(2, '0');
  
  // Formato exato: "Mon Oct 5 2020 00:00:00 GMT -0300"
  const formatted = `${day} ${month} ${dateNum} ${year} ${hours}:${minutes}:${seconds} GMT -0300`;
  
  // Codifica para URL (espaços viram %20)
  return encodeURIComponent(formatted);
}

/**
 * Calcula datas para teste
 */
function getTestDates(startDate, endDate) {
  if (startDate && endDate) {
    // Se vierem no formato YYYY-MM-DD, converte para formato da API
    // Importante: criar a data considerando o timezone de Brasília (-03:00)
    if (typeof startDate === 'string' && startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [startYear, startMonth, startDay] = startDate.split('-');
      const [endYear, endMonth, endDay] = endDate.split('-');
      
      // Cria datas no timezone de Brasília
      const start = new Date(Date.UTC(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay), 3, 0, 0));
      const end = new Date(Date.UTC(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay), 26, 59, 59));
      
      return { 
        startDate: formatDateForAPI(start), 
        endDate: formatDateForAPI(end) 
      };
    }
    return { startDate, endDate };
  }
  // Se não fornecido, usa ontem no timezone de Brasília
  const now = new Date();
  const brtOffset = -3 * 60; // -3 horas em minutos
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brtNow = new Date(utc + (brtOffset * 60000));
  
  const yesterday = new Date(brtNow);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  console.log(`Data atual (BRT): ${brtNow.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  console.log(`Ontem (BRT): ${yesterday.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  console.log(`Dia da semana de ontem: ${yesterday.toLocaleDateString('pt-BR', { weekday: 'long' })}`);
  
  const startDateFormatted = formatDateForAPI(yesterday);
  
  const endDateObj = new Date(yesterday);
  endDateObj.setHours(23, 59, 59, 999);
  const endDateFormatted = formatDateForAPI(endDateObj);
  
  return { startDate: startDateFormatted, endDate: endDateFormatted };
}

/**
 * Testa conexão com API 55PBX
 */
app.post('/api/test/pbx', async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.body;
    
    if (!reportType) {
      return res.status(400).json({ error: 'reportType é obrigatório (1, 2 ou 4)' });
    }
    
    if (!PBX_TOKEN) {
      return res.status(500).json({ error: 'PBX_TOKEN não configurado' });
    }
    
    const { startDate: start, endDate: end } = getTestDates(startDate, endDate);
    
    // Converte reportType para formato da API (1 -> report_01, 2 -> report_02, 4 -> report_04)
    const reportTypeFormatted = reportType === '1' ? 'report_01' : 
                                (reportType === '2' ? 'report_02' : 
                                (reportType === '4' ? 'report_04' : `report_${reportType}`));
    
    const url = `${PBX_BASE_URL}/${start}/${end}/${PBX_QUEUE}/${PBX_NUMBER}/${PBX_AGENT}/${reportTypeFormatted}/${PBX_QUIZ_ID}/${PBX_TIMEZONE}`;
    
    const response = await axios.get(url, {
      headers: {
        'key': PBX_TOKEN,
        'Chave': PBX_TOKEN,
        'Content-Type': 'application/json'
      },
      timeout: 30000,
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      }
    });
    
    // Verifica códigos de erro específicos da API
    if (response.status === 400) {
      throw new Error(`Erro 400: Parâmetro obrigatório faltando ou incorreto`);
    }
    if (response.status === 401) {
      throw new Error(`Erro 401: Falta de autorização. Verifique o token`);
    }
    if (response.status === 404) {
      throw new Error(`Erro 404: Endpoint não encontrado`);
    }
    if (response.status >= 500) {
      throw new Error(`Erro ${response.status}: Erro interno do 55PBX`);
    }
    
    const data = response.data;
    const isArray = Array.isArray(data);
    
    
    // Se for objeto, verifica se tem propriedades que indicam dados
    let count = 0;
    let actualData = data;
    
    if (isArray) {
      count = data.length;
      console.log(`✅ Array direto com ${count} itens`);
    } else if (data && typeof data === 'object') {
      // Verifica se o objeto tem data_report02 (formato do Report_02)
      if (data.data_report02 && Array.isArray(data.data_report02)) {
        actualData = data.data_report02;
        count = data.data_report02.length;
        console.log(`✅ Dados encontrados em 'data_report02': ${count} itens`);
      } else if (data.data && Array.isArray(data.data)) {
        actualData = data.data;
        count = data.data.length;
        console.log(`✅ Dados encontrados em 'data': ${count} itens`);
      } else if (data.results && Array.isArray(data.results)) {
        actualData = data.results;
        count = data.results.length;
        console.log(`✅ Dados encontrados em 'results': ${count} itens`);
      } else if (data.items && Array.isArray(data.items)) {
        actualData = data.items;
        count = data.items.length;
        console.log(`✅ Dados encontrados em 'items': ${count} itens`);
      } else {
        count = 0;
      }
    }
    
    // Limita o tamanho dos dados retornados para evitar "request entity too large"
    let limitedFullData = Array.isArray(actualData) ? actualData : data;
    let truncated = false;
    let totalCount = null;
    
    if (Array.isArray(limitedFullData)) {
      totalCount = limitedFullData.length;
      if (limitedFullData.length > 500) {
        console.log(`⚠️ Array muito grande (${limitedFullData.length} itens), limitando para 500 itens`);
        limitedFullData = limitedFullData.slice(0, 500);
        truncated = true;
      }
    }
    
    // Para objetos grandes, limita o tamanho
    let limitedRawResponse = data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      try {
        const jsonString = JSON.stringify(data);
        if (jsonString.length > 500000) { // 500KB
          console.log(`⚠️ Objeto muito grande (${jsonString.length} bytes), limitando resposta`);
          limitedRawResponse = { 
            message: 'Objeto muito grande, dados truncados',
            keys: Object.keys(data),
            sample: data.data_report02 ? data.data_report02.slice(0, 50) : null,
            totalItems: data.data_report02 ? data.data_report02.length : null
          };
          truncated = true;
        }
      } catch (e) {
        console.log('⚠️ Erro ao serializar objeto:', e.message);
        limitedRawResponse = { message: 'Erro ao serializar objeto', keys: Object.keys(data) };
      }
    }
    
    res.json({
      success: true,
      url,
      dataCount: count,
      isArray: isArray || Array.isArray(actualData),
      sampleData: Array.isArray(actualData) && actualData.length > 0 ? actualData[0] : (isArray && data.length > 0 ? data[0] : data),
      fullData: limitedFullData,
      rawResponse: limitedRawResponse,
      objectKeys: !isArray && data && typeof data === 'object' ? Object.keys(data) : null,
      truncated: truncated,
      totalCount: totalCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Testa conexão com Google Sheets
 */
app.post('/api/test/sheets', async (req, res) => {
  try {
    const { sheetId, sheetType } = req.body;
    
    const targetSheetId = sheetId || (sheetType === 'chamadas' ? SHEET_CHAMADAS_ID : SHEET_PAUSAS_ID);
    
    if (!targetSheetId) {
      return res.status(400).json({ 
        success: false,
        error: 'ID da planilha não fornecido',
        message: 'Configure SHEET_CHAMADAS_ID ou SHEET_PAUSAS_ID no arquivo .env'
      });
    }
    
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
      return res.status(400).json({ 
        success: false,
        error: 'Credenciais do Google não configuradas',
        message: 'Configure GOOGLE_SERVICE_ACCOUNT_EMAIL e GOOGLE_PRIVATE_KEY no arquivo .env',
        missing: {
          email: !GOOGLE_SERVICE_ACCOUNT_EMAIL,
          key: !GOOGLE_PRIVATE_KEY
        }
      });
    }
    
    // Cria cliente de autenticação JWT
    const auth = new JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const doc = new GoogleSpreadsheet(targetSheetId, auth);
    
    await doc.loadInfo();
    
    const sheets = doc.sheetsByIndex.map(sheet => ({
      title: sheet.title,
      rowCount: sheet.rowCount,
      columnCount: sheet.columnCount
    }));
    
    // Tenta ler algumas linhas da primeira aba
    const firstSheet = doc.sheetsByIndex[0];
    await firstSheet.loadHeaderRow();
    const headers = firstSheet.headerValues;
    const rows = await firstSheet.getRows({ limit: 5 });
    const sampleRows = rows.map(row => row._rawData);
    
    res.json({
      success: true,
      sheetId: targetSheetId,
      title: doc.title,
      sheets,
      currentSheet: {
        title: firstSheet.title,
        headers,
        sampleRows,
        rowCount: firstSheet.rowCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

/**
 * Retorna estatísticas do sistema
 */
app.get('/api/stats', async (req, res) => {
  try {
    const schedulerStatus = getSchedulerStatus();
    const lastExec = schedulerStatus.lastExecution;
    
    res.json({
      chamadas: lastExec?.chamadasCount || 0,
      pausas: lastExec?.pausasCount || 0,
      lastExecution: lastExec?.startTime || null,
      periodProcessed: lastExec?.startTime ? 
        new Date(lastExec.startTime).toLocaleDateString('pt-BR') : null
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Retorna status do scheduler
 */
app.get('/api/scheduler/status', (req, res) => {
  try {
    const status = getSchedulerStatus();
    res.json(status);
  } catch (error) {
    console.error('Erro ao obter status do scheduler:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Inicia o scheduler
 */
app.post('/api/scheduler/start', (req, res) => {
  try {
    const { schedule, customTime, frequency } = req.body;
    
    let cronExpression = schedule || '0 0 * * *';
    
    // Se foi fornecido um horário personalizado, converte para cron
    if (customTime) {
      const daily = frequency !== 'once';
      cronExpression = timeToCron(customTime, daily);
      
      if (!cronExpression) {
        return res.status(400).json({
          success: false,
          error: 'O horário especificado já passou hoje. Escolha um horário futuro.'
        });
      }
    }
    
    const result = startScheduler(cronExpression);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Erro ao iniciar scheduler:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Para o scheduler
 */
app.post('/api/scheduler/stop', (req, res) => {
  try {
    const result = stopScheduler();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Executa ETL manualmente (para testes)
 */
app.post('/api/scheduler/run', async (req, res) => {
  try {
    // Executa em background para não bloquear a resposta
    runManual().catch(err => {
      logger.error('Erro na execução manual', err);
    });
    
    res.json({
      success: true,
      message: 'Execução manual iniciada. Verifique os logs para acompanhar o progresso.'
    });
  } catch (error) {
    logger.error('Erro ao executar manualmente', error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Retorna logs do sistema
 */
app.get('/api/logs', (req, res) => {
  try {
    const { startDate, endDate, level, since, limit = 100 } = req.query;
    // Se 'since' for fornecido, usa como startDate (logs desde esse timestamp)
    const startDateFilter = since ? new Date(since) : (startDate ? new Date(startDate) : null);
    const logs = logger.getLogs(startDateFilter, endDate ? new Date(endDate) : null, level, parseInt(limit));
    
    res.json({
      success: true,
      logs,
      count: logs.length
    });
  } catch (error) {
    logger.error('Erro ao obter logs', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Retorna histórico de execuções
 */
app.get('/api/history', (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const history = getHistory(parseInt(limit));
    const stats = getStats();
    
    res.json({
      success: true,
      history,
      stats,
      count: history.length
    });
  } catch (error) {
    logger.error('Erro ao obter histórico', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Retorna estatísticas do histórico
 */
app.get('/api/history/stats', (req, res) => {
  try {
    const stats = getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Erro ao obter estatísticas do histórico', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Rota principal - serve o index.html
app.get('/', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } catch (error) {
    console.error('Erro ao servir index.html:', error);
    res.status(500).send('Erro ao carregar página');
  }
});

// Serve arquivos estáticos (CSS, JS, imagens, etc)
app.get('/*', (req, res, next) => {
  // Se for uma rota de API, passa para o próximo handler
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Tenta servir arquivo estático
  const filePath = path.join(__dirname, 'public', req.path);
  res.sendFile(filePath, (err) => {
    // Se arquivo não encontrado e não for API, serve index.html (SPA)
    if (err && !req.path.startsWith('/api/')) {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
  });
});

// Handler de erro global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  logger.error('Erro não tratado', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Exporta o app para Vercel
export default app;

// Inicia servidor apenas se não estiver em ambiente serverless
if (process.env.VERCEL !== '1' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(PORT, () => {
  console.log(`\n✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Dashboard disponível em http://localhost:${PORT}`);
  console.log(`⏰ Rotas do scheduler disponíveis:`);
  console.log(`   GET  /api/scheduler/status`);
  console.log(`   POST /api/scheduler/start`);
  console.log(`   POST /api/scheduler/stop`);
  console.log(`   POST /api/scheduler/run`);
  console.log(`\n📋 Rotas de histórico disponíveis:`);
  console.log(`   GET  /api/history`);
  console.log(`   GET  /api/history/stats`);
  console.log(`   GET  /api/logs`);
  
  // Inicia o scheduler automaticamente (já estamos dentro do if que verifica serverless)
  try {
    const result = startScheduler('0 0 * * *'); // Diariamente às 00:00
    if (result.success) {
      console.log(`\n⏰ Scheduler iniciado automaticamente`);
      console.log(`   Agendamento: ${result.schedule} (Diariamente às 00:00)`);
      if (result.nextExecution) {
        console.log(`   Próxima execução: ${result.nextExecution.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      }
    } else {
      console.log(`\n⚠️ Não foi possível iniciar scheduler automaticamente: ${result.message || result.error}`);
    }
  } catch (error) {
    logger.error('Erro ao iniciar scheduler automaticamente', error);
    console.log(`\n⚠️ Erro ao iniciar scheduler: ${error.message}`);
  }
  
  console.log(`\n`);
  });
}


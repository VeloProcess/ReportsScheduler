import cron from 'node-cron';
import { processChamadas, processPausas, getYesterdayDates, fetchPBXData, transformChamadasData, transformPausasData } from '../index.js';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
import { addExecution } from '../utils/history.js';
import { notifyETLExecution, notifyCriticalError } from '../utils/notifications.js';

dotenv.config();

// Estado do scheduler
let cronJob = null;
let isRunning = false;
let lastExecution = null;
let executionHistory = [];
let currentSchedule = null;

/**
 * Executa o ETL completo
 */
async function runETL() {
  if (isRunning) {
    logger.warn('ETL já está em execução, pulando esta execução');
    return { success: false, message: 'ETL já está em execução' };
  }

  isRunning = true;
  const startTime = new Date();
  let periodProcessed = 'N/A';
  
  try {
    logger.etl('=== INICIANDO EXECUÇÃO AGENDADA ===', {
      timestamp: startTime.toISOString(),
      timezone: 'America/Sao_Paulo'
    });
    
    // Usa dados de ontem (padrão)
    const { startDate, endDate } = getYesterdayDates();
    periodProcessed = `${decodeURIComponent(startDate)} até ${decodeURIComponent(endDate)}`;
    logger.etl('Período processado', { startDate, endDate, periodProcessed });
    
    let chamadasCount = 0;
    let pausasCount = 0;
    let errors = [];
    
    // Processa chamadas
    try {
      logger.etl('Processando chamadas...');
      await processChamadas(startDate, endDate);
      // Busca dados para contar (após processar para ter o count real)
      try {
        const rawDataChamadas = await fetchPBXData('2', startDate, endDate);
        const transformedChamadas = transformChamadasData(rawDataChamadas);
        chamadasCount = transformedChamadas.length;
        logger.etl(`Chamadas processadas: ${chamadasCount}`);
      } catch (countError) {
        // Se falhar ao contar, não é crítico
        logger.warn('Não foi possível contar chamadas', { error: countError.message });
      }
    } catch (error) {
      logger.error('Erro ao processar chamadas', error);
      errors.push(`Chamadas: ${error.message}`);
    }
    
    // Processa pausas
    try {
      logger.etl('Processando pausas...');
      await processPausas(startDate, endDate);
      // Busca dados para contar (após processar para ter o count real)
      try {
        const rawDataPausas = await fetchPBXData('4', startDate, endDate);
        const transformedPausas = transformPausasData(rawDataPausas);
        pausasCount = transformedPausas.length;
        logger.etl(`Pausas processadas: ${pausasCount}`);
      } catch (countError) {
        // Se falhar ao contar, não é crítico
        logger.warn('Não foi possível contar pausas', { error: countError.message });
      }
    } catch (error) {
      logger.error('Erro ao processar pausas', error);
      errors.push(`Pausas: ${error.message}`);
    }
    
    const endTime = new Date();
    const duration = endTime - startTime;
    
    const execution = {
      startTime,
      endTime,
      duration,
      success: errors.length === 0,
      chamadasCount,
      pausasCount,
      errors: errors.length > 0 ? errors : undefined,
      periodProcessed
    };
    
    executionHistory.push(execution);
    
    // Mantém apenas os últimos 10 registros em memória
    if (executionHistory.length > 10) {
      executionHistory.shift();
    }
    
    // Salva no histórico persistente
    addExecution(execution);
    
    lastExecution = execution;
    
    logger.etl(`Execução concluída em ${(duration / 1000).toFixed(2)}s`, {
      duration: duration,
      success: execution.success,
      chamadasCount,
      pausasCount,
      errors: errors.length > 0 ? errors : undefined
    });
    
    if (errors.length > 0) {
      logger.warn('Erros encontrados na execução', { errors });
    }
    
    // Envia notificações
    try {
      await notifyETLExecution(execution);
    } catch (notifyError) {
      logger.error('Erro ao enviar notificações', notifyError);
      // Não falha a execução se a notificação falhar
    }
    
    return execution;
    
  } catch (error) {
    const endTime = new Date();
    const duration = endTime - startTime;
    
    const execution = {
      startTime,
      endTime,
      duration,
      success: false,
      error: error.message,
      errors: [error.message],
      periodProcessed: periodProcessed || 'N/A'
    };
    
    executionHistory.push(execution);
    
    if (executionHistory.length > 10) {
      executionHistory.shift();
    }
    
    // Salva no histórico persistente mesmo em caso de erro
    addExecution(execution);
    
    lastExecution = execution;
    
    logger.error('Erro na execução do ETL', error);
    
    // Notifica sobre erro crítico
    try {
      await notifyCriticalError(error, {
        startTime: startTime.toISOString(),
        periodProcessed: periodProcessed || 'N/A'
      });
      // Também notifica como execução com erro
      await notifyETLExecution(execution);
    } catch (notifyError) {
      logger.error('Erro ao enviar notificações de erro', notifyError);
    }
    
    return execution;
  } finally {
    isRunning = false;
  }
}

/**
 * Converte hora e minuto para expressão cron
 * @param {string} time - Formato HH:MM (ex: "14:30")
 * @param {boolean} daily - Se true, agenda diariamente; se false, apenas uma vez hoje
 * @returns {string} Expressão cron
 */
function timeToCron(time, daily = true) {
  const [hours, minutes] = time.split(':').map(Number);
  
  if (daily) {
    // Diariamente no horário especificado: "minuto hora * * *"
    return `${minutes} ${hours} * * *`;
  } else {
    // Uma vez apenas hoje: calcula o timestamp específico
    // Para isso, precisamos usar uma expressão cron que execute apenas hoje
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
    
    // Se o horário já passou hoje, retorna null (não agenda)
    if (today <= now) {
      return null;
    }
    
    // Retorna expressão cron para hoje: "minuto hora dia mês *"
    return `${minutes} ${hours} ${today.getDate()} ${today.getMonth() + 1} *`;
  }
}

/**
 * Calcula próxima execução baseada na expressão cron
 */
function getNextExecutionTime(schedule) {
  if (!schedule) return null;
  
  try {
    // Para expressões cron simples como "minuto hora * * *"
    const parts = schedule.split(' ');
    if (parts.length === 5) {
      const [minute, hour, day, month, weekday] = parts;
      
      const now = new Date();
      const next = new Date();
      
      // Se é diário (* * * *)
      if (day === '*' && month === '*' && weekday === '*') {
        next.setHours(parseInt(hour) || 0, parseInt(minute) || 0, 0, 0);
        
        // Se o horário já passou hoje, agenda para amanhã
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        
        return next;
      }
      
      // Se é uma data específica (execução única)
      if (day !== '*' && month !== '*') {
        next.setFullYear(now.getFullYear());
        next.setMonth(parseInt(month) - 1);
        next.setDate(parseInt(day));
        next.setHours(parseInt(hour) || 0, parseInt(minute) || 0, 0, 0);
        
        // Se já passou, retorna null
        if (next <= now) {
          return null;
        }
        
        return next;
      }
    }
    
    // Fallback: calcula próxima meia-noite
    const brtOffset = -3 * 60;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const brtNow = new Date(utc + (brtOffset * 60000));
    const nextMidnight = new Date(brtNow);
    nextMidnight.setDate(nextMidnight.getDate() + 1);
    nextMidnight.setHours(0, 0, 0, 0);
    const utcNext = new Date(nextMidnight.getTime() - (brtOffset * 60000));
    
    return utcNext;
  } catch (error) {
    logger.error('Erro ao calcular próxima execução', error);
    return null;
  }
}

/**
 * Inicia o scheduler
 * @param {string} schedule - Expressão cron (padrão: '0 0 * * *' = meia-noite todo dia)
 */
function startScheduler(schedule = '0 0 * * *') {
  if (cronJob) {
    logger.warn('Scheduler já está ativo');
    return { success: false, message: 'Scheduler já está ativo' };
  }
  
  // Valida expressão cron
  if (!cron.validate(schedule)) {
    const error = `Expressão cron inválida: ${schedule}`;
    logger.error(error);
    return { success: false, error };
  }
  
  logger.info(`Iniciando scheduler com expressão: ${schedule}`);
  const nextExec = getNextExecutionTime(schedule);
  if (nextExec) {
    logger.info(`Próxima execução: ${nextExec.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  }
  
  cronJob = cron.schedule(schedule, runETL, {
    scheduled: true,
    timezone: 'America/Sao_Paulo'
  });
  
  currentSchedule = schedule;
  
  return { 
    success: true, 
    message: 'Scheduler iniciado com sucesso',
    schedule,
    nextExecution: nextExec
  };
}

/**
 * Para o scheduler
 */
function stopScheduler() {
  if (!cronJob) {
    console.log('⚠️ Scheduler não está ativo');
    return { success: false, message: 'Scheduler não está ativo' };
  }
  
  cronJob.stop();
  cronJob = null;
  currentSchedule = null;
  console.log('🛑 Scheduler parado');
  
  return { success: true, message: 'Scheduler parado com sucesso' };
}

/**
 * Retorna o status do scheduler
 */
function getSchedulerStatus() {
  const nextExec = currentSchedule ? getNextExecutionTime(currentSchedule) : null;
  
  return {
    isActive: cronJob !== null,
    isRunning,
    schedule: currentSchedule,
    lastExecution,
    executionHistory: executionHistory.slice(-5), // Últimas 5 execuções
    nextExecution: nextExec
  };
}

/**
 * Executa o ETL manualmente (fora do schedule)
 */
async function runManual() {
  return await runETL();
}

export {
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
  runManual,
  runETL,
  timeToCron
};


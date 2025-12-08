import cron from 'node-cron';
import { processChamadas, processPausas, getYesterdayDates, fetchPBXData, transformChamadasData, transformPausasData } from '../index.js';
import dotenv from 'dotenv';

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
    console.log('⚠️ ETL já está em execução, pulando esta execução...');
    return { success: false, message: 'ETL já está em execução' };
  }

  isRunning = true;
  const startTime = new Date();
  
  try {
    console.log('\n=== INICIANDO EXECUÇÃO AGENDADA ===');
    console.log(`Data/Hora: ${startTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    
    // Usa dados de ontem (padrão)
    const { startDate, endDate } = getYesterdayDates();
    console.log(`Período: ${decodeURIComponent(startDate)} até ${decodeURIComponent(endDate)}\n`);
    
    let chamadasCount = 0;
    let pausasCount = 0;
    let errors = [];
    
    // Processa chamadas
    try {
      await processChamadas(startDate, endDate);
      // Busca dados para contar (após processar para ter o count real)
      try {
        const rawDataChamadas = await fetchPBXData('2', startDate, endDate);
        const transformedChamadas = transformChamadasData(rawDataChamadas);
        chamadasCount = transformedChamadas.length;
      } catch (countError) {
        // Se falhar ao contar, não é crítico
        console.warn('⚠️ Não foi possível contar chamadas:', countError.message);
      }
    } catch (error) {
      console.error('❌ Erro ao processar chamadas:', error.message);
      errors.push(`Chamadas: ${error.message}`);
    }
    
    // Processa pausas
    try {
      await processPausas(startDate, endDate);
      // Busca dados para contar (após processar para ter o count real)
      try {
        const rawDataPausas = await fetchPBXData('4', startDate, endDate);
        const transformedPausas = transformPausasData(rawDataPausas);
        pausasCount = transformedPausas.length;
      } catch (countError) {
        // Se falhar ao contar, não é crítico
        console.warn('⚠️ Não foi possível contar pausas:', countError.message);
      }
    } catch (error) {
      console.error('❌ Erro ao processar pausas:', error.message);
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
      errors: errors.length > 0 ? errors : undefined
    };
    
    executionHistory.push(execution);
    
    // Mantém apenas os últimos 10 registros
    if (executionHistory.length > 10) {
      executionHistory.shift();
    }
    
    lastExecution = execution;
    
    console.log(`\n✅ Execução concluída em ${(duration / 1000).toFixed(2)}s`);
    if (errors.length > 0) {
      console.log(`⚠️ Erros encontrados: ${errors.join(', ')}`);
    }
    console.log('=====================================\n');
    
    return execution;
    
  } catch (error) {
    const endTime = new Date();
    const duration = endTime - startTime;
    
    const execution = {
      startTime,
      endTime,
      duration,
      success: false,
      error: error.message
    };
    
    executionHistory.push(execution);
    
    if (executionHistory.length > 10) {
      executionHistory.shift();
    }
    
    lastExecution = execution;
    
    console.error(`\n❌ Erro na execução: ${error.message}`);
    console.error('=====================================\n');
    
    return execution;
  } finally {
    isRunning = false;
  }
}

/**
 * Calcula próxima execução baseada na expressão cron
 */
function getNextExecutionTime(schedule) {
  if (!schedule) return null;
  
  // Para '0 0 * * *' (meia-noite todo dia)
  // Calcula próxima meia-noite no timezone de São Paulo
  const now = new Date();
  const next = new Date();
  
  // Converte para timezone de São Paulo
  const brtOffset = -3 * 60; // -3 horas em minutos
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brtNow = new Date(utc + (brtOffset * 60000));
  
  // Próxima meia-noite
  const nextMidnight = new Date(brtNow);
  nextMidnight.setDate(nextMidnight.getDate() + 1);
  nextMidnight.setHours(0, 0, 0, 0);
  
  // Converte de volta para UTC
  const utcNext = new Date(nextMidnight.getTime() - (brtOffset * 60000));
  
  return utcNext;
}

/**
 * Inicia o scheduler
 * @param {string} schedule - Expressão cron (padrão: '0 0 * * *' = meia-noite todo dia)
 */
function startScheduler(schedule = '0 0 * * *') {
  if (cronJob) {
    console.log('⚠️ Scheduler já está ativo');
    return { success: false, message: 'Scheduler já está ativo' };
  }
  
  // Valida expressão cron
  if (!cron.validate(schedule)) {
    const error = `Expressão cron inválida: ${schedule}`;
    console.error(`❌ ${error}`);
    return { success: false, error };
  }
  
  console.log(`🕐 Iniciando scheduler com expressão: ${schedule}`);
  const nextExec = getNextExecutionTime(schedule);
  if (nextExec) {
    console.log(`📅 Próxima execução: ${nextExec.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
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
  runETL
};


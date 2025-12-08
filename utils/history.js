import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HISTORY_FILE = path.join(__dirname, '..', 'logs', 'execution-history.json');
const MAX_HISTORY_ENTRIES = 100;

/**
 * Carrega histórico de execuções
 */
function loadHistory() {
  if (!fs.existsSync(HISTORY_FILE)) {
    return [];
  }

  try {
    const content = fs.readFileSync(HISTORY_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    return [];
  }
}

/**
 * Salva histórico de execuções
 */
function saveHistory(history) {
  // Garante que o diretório existe
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Mantém apenas os últimos N registros
  const limitedHistory = history.slice(-MAX_HISTORY_ENTRIES);

  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(limitedHistory, null, 2), 'utf8');
  } catch (error) {
    console.error('Erro ao salvar histórico:', error);
  }
}

/**
 * Adiciona execução ao histórico
 */
function addExecution(execution) {
  const history = loadHistory();
  
  const executionEntry = {
    id: Date.now().toString(),
    startTime: execution.startTime instanceof Date ? execution.startTime.toISOString() : execution.startTime,
    endTime: execution.endTime instanceof Date ? execution.endTime.toISOString() : execution.endTime,
    duration: execution.duration,
    success: execution.success,
    chamadasCount: execution.chamadasCount || 0,
    pausasCount: execution.pausasCount || 0,
    errors: execution.errors || [],
    periodProcessed: execution.periodProcessed || null
  };

  history.push(executionEntry);
  saveHistory(history);

  return executionEntry;
}

/**
 * Obtém histórico de execuções
 */
function getHistory(limit = 50) {
  const history = loadHistory();
  return history.slice(-limit).reverse(); // Mais recentes primeiro
}

/**
 * Obtém estatísticas do histórico
 */
function getStats() {
  const history = loadHistory();
  
  if (history.length === 0) {
    return {
      total: 0,
      successful: 0,
      failed: 0,
      successRate: 0,
      avgDuration: 0,
      totalChamadas: 0,
      totalPausas: 0
    };
  }

  const successful = history.filter(e => e.success).length;
  const failed = history.length - successful;
  const durations = history.map(e => e.duration).filter(d => d > 0);
  const avgDuration = durations.length > 0 
    ? durations.reduce((a, b) => a + b, 0) / durations.length 
    : 0;
  
  const totalChamadas = history.reduce((sum, e) => sum + (e.chamadasCount || 0), 0);
  const totalPausas = history.reduce((sum, e) => sum + (e.pausasCount || 0), 0);

  return {
    total: history.length,
    successful,
    failed,
    successRate: (successful / history.length) * 100,
    avgDuration: Math.round(avgDuration),
    totalChamadas,
    totalPausas
  };
}

export { addExecution, getHistory, getStats };


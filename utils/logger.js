import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório de logs
const LOGS_DIR = path.join(__dirname, '..', 'logs');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_LOG_FILES = 5;

// Verifica se está em ambiente serverless
const IS_SERVERLESS = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production';

// Garante que o diretório de logs existe (apenas se não for serverless)
if (!IS_SERVERLESS && !fs.existsSync(LOGS_DIR)) {
  try {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  } catch (error) {
    console.warn('Não foi possível criar diretório de logs:', error.message);
  }
}

/**
 * Formata mensagem de log com timestamp
 */
function formatLogMessage(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(data && { data })
  };
  
  return JSON.stringify(logEntry);
}

/**
 * Rotaciona arquivo de log se necessário
 */
function rotateLogFile(logFile) {
  if (!fs.existsSync(logFile)) {
    return;
  }

  const stats = fs.statSync(logFile);
  if (stats.size < MAX_LOG_SIZE) {
    return;
  }

  // Rotaciona arquivos antigos
  for (let i = MAX_LOG_FILES - 1; i >= 1; i--) {
    const oldFile = `${logFile}.${i}`;
    const newFile = `${logFile}.${i + 1}`;
    
    if (fs.existsSync(oldFile)) {
      if (i === MAX_LOG_FILES - 1) {
        // Remove o arquivo mais antigo
        fs.unlinkSync(oldFile);
      } else {
        fs.renameSync(oldFile, newFile);
      }
    }
  }

  // Move o arquivo atual para .1
  fs.renameSync(logFile, `${logFile}.1`);
}

/**
 * Escreve no arquivo de log
 */
function writeToFile(level, message, data = null) {
  // Em ambiente serverless, apenas loga no console
  if (IS_SERVERLESS) {
    return;
  }
  
  // Verifica se o diretório existe antes de escrever
  if (!fs.existsSync(LOGS_DIR)) {
    try {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    } catch (error) {
      console.warn('Não foi possível criar diretório de logs:', error.message);
      return;
    }
  }
  
  const today = new Date().toISOString().split('T')[0];
  const logFile = path.join(LOGS_DIR, `etl-${today}.log`);
  
  // Rotaciona se necessário
  try {
    rotateLogFile(logFile);
  } catch (error) {
    console.warn('Erro ao rotacionar log:', error.message);
  }
  
  const logMessage = formatLogMessage(level, message, data);
  
  try {
    fs.appendFileSync(logFile, logMessage + '\n', 'utf8');
  } catch (error) {
    console.error('Erro ao escrever no arquivo de log:', error);
  }
}

/**
 * Logger estruturado
 */
const logger = {
  /**
   * Log de informação
   */
  info(message, data = null) {
    const formatted = formatLogMessage('INFO', message, data);
    console.log(`[INFO] ${message}`, data || '');
    writeToFile('INFO', message, data);
  },

  /**
   * Log de aviso
   */
  warn(message, data = null) {
    const formatted = formatLogMessage('WARN', message, data);
    console.warn(`[WARN] ${message}`, data || '');
    writeToFile('WARN', message, data);
  },

  /**
   * Log de erro
   */
  error(message, error = null) {
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      ...(error.response && {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      })
    } : null;
    
    const formatted = formatLogMessage('ERROR', message, errorData);
    console.error(`[ERROR] ${message}`, error || '');
    writeToFile('ERROR', message, errorData);
  },

  /**
   * Log de debug
   */
  debug(message, data = null) {
    if (process.env.LOG_LEVEL === 'debug') {
      const formatted = formatLogMessage('DEBUG', message, data);
      console.debug(`[DEBUG] ${message}`, data || '');
      writeToFile('DEBUG', message, data);
    }
  },

  /**
   * Log de execução ETL
   */
  etl(message, data = null) {
    const formatted = formatLogMessage('ETL', message, data);
    console.log(`[ETL] ${message}`, data || '');
    writeToFile('ETL', message, data);
  },

  /**
   * Obtém logs de um período
   */
  getLogs(startDate = null, endDate = null, level = null, limit = 100) {
    // Em ambiente serverless, retorna array vazio (logs não são persistidos)
    if (IS_SERVERLESS || !fs.existsSync(LOGS_DIR)) {
      return [];
    }
    
    const logs = [];
    let files = [];
    
    try {
      files = fs.readdirSync(LOGS_DIR)
        .filter(file => file.startsWith('etl-') && file.endsWith('.log'))
        .sort()
        .reverse();
    } catch (error) {
      console.warn('Erro ao ler diretório de logs:', error.message);
      return [];
    }

    for (const file of files) {
      const filePath = path.join(LOGS_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lines = fileContent.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const logEntry = JSON.parse(line);
          
          // Filtra por data
          if (startDate && new Date(logEntry.timestamp) < new Date(startDate)) {
            continue;
          }
          if (endDate && new Date(logEntry.timestamp) > new Date(endDate)) {
            continue;
          }
          
          // Filtra por nível
          if (level && logEntry.level !== level) {
            continue;
          }
          
          logs.push(logEntry);
          
          if (logs.length >= limit) {
            return logs;
          }
        } catch (error) {
          // Ignora linhas inválidas
          continue;
        }
      }
    }

    return logs.slice(0, limit);
  }
};

export default logger;


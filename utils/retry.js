import logger from './logger.js';

/**
 * Executa uma função com retry automático
 * @param {Function} fn - Função assíncrona a executar
 * @param {Object} options - Opções de retry
 * @param {number} options.maxRetries - Número máximo de tentativas (padrão: 3)
 * @param {number} options.delay - Delay inicial entre tentativas em ms (padrão: 1000)
 * @param {number} options.backoff - Multiplicador de delay (padrão: 2)
 * @param {Function} options.shouldRetry - Função que determina se deve tentar novamente (padrão: retry em todos os erros)
 * @param {string} options.operationName - Nome da operação para logs
 * @returns {Promise} Resultado da função
 */
export async function retry(fn, options = {}) {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    shouldRetry = () => true,
    operationName = 'Operação'
  } = options;

  let lastError;
  let currentDelay = delay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`${operationName} - Tentativa ${attempt}/${maxRetries}`);
      const result = await fn();
      
      if (attempt > 1) {
        logger.info(`${operationName} - Sucesso na tentativa ${attempt}`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Verifica se deve tentar novamente
      if (!shouldRetry(error, attempt)) {
        logger.warn(`${operationName} - Não será tentado novamente`, {
          error: error.message,
          attempt
        });
        throw error;
      }

      // Se não é a última tentativa, aguarda e tenta novamente
      if (attempt < maxRetries) {
        logger.warn(`${operationName} - Erro na tentativa ${attempt}/${maxRetries}`, {
          error: error.message,
          nextAttemptIn: `${currentDelay}ms`
        });
        
        await sleep(currentDelay);
        currentDelay *= backoff; // Aumenta o delay exponencialmente
      } else {
        logger.error(`${operationName} - Todas as tentativas falharam`, {
          error: error.message,
          totalAttempts: maxRetries
        });
      }
    }
  }

  throw lastError;
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Determina se um erro HTTP deve ser retentado
 */
export function shouldRetryHttpError(error, attempt) {
  // Verifica se tem statusCode no erro (erros customizados)
  if (error.statusCode) {
    // Não retry em erros de autenticação/autorização (401, 404)
    if (error.statusCode === 401 || error.statusCode === 404) {
      return false;
    }
    // Retry em erros de servidor (5xx)
    if (error.statusCode >= 500) {
      return true;
    }
  }
  
  // Verifica resposta HTTP do axios
  if (error.response) {
    const status = error.response.status;
    
    // Não retry em erros de autenticação/autorização (401, 404)
    if (status === 401 || status === 404) {
      return false;
    }
    
    // Retry em erros de servidor (5xx) e rate limit (429)
    if (status >= 500 || status === 429) {
      return true;
    }
    
    // Não retry em outros erros de cliente (4xx) exceto 429
    if (status >= 400 && status < 500 && status !== 429) {
      return false;
    }
  }
  
  // Retry em erros de rede/timeout
  if (error.code === 'ECONNRESET' || 
      error.code === 'ETIMEDOUT' || 
      error.code === 'ENOTFOUND' ||
      error.message?.includes('timeout')) {
    return true;
  }
  
  // Por padrão, retry (para erros desconhecidos)
  return true;
}

/**
 * Retry específico para requisições HTTP
 */
export async function retryHttpRequest(requestFn, options = {}) {
  return retry(requestFn, {
    maxRetries: options.maxRetries || 3,
    delay: options.delay || 2000,
    backoff: options.backoff || 2,
    shouldRetry: shouldRetryHttpError,
    operationName: options.operationName || 'Requisição HTTP',
    ...options
  });
}


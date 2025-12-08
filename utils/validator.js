import logger from './logger.js';

/**
 * Valida dados de chamadas antes de salvar
 */
export function validateChamadasData(data) {
  if (!Array.isArray(data)) {
    throw new Error('Dados de chamadas devem ser um array');
  }

  const validated = [];
  const invalid = [];

  data.forEach((item, index) => {
    try {
      // Validações básicas
      if (!item || typeof item !== 'object') {
        invalid.push({ index, reason: 'Item não é um objeto válido' });
        return;
      }

      // Valida campos obrigatórios (pelo menos um identificador deve existir)
      const hasIdentifier = item['Chamada'] || item['Operador'] || item['Data'] || item['Numero'];
      
      if (!hasIdentifier) {
        invalid.push({ index, reason: 'Item sem identificador válido' });
        return;
      }

      // Valida formato de data se existir
      if (item['Data'] && typeof item['Data'] === 'string') {
        const dateStr = item['Data'].trim();
        // Aceita vários formatos de data
        if (dateStr && !dateStr.match(/^\d{4}-\d{2}-\d{2}/) && 
            !dateStr.match(/^\d{2}\/\d{2}\/\d{4}/) &&
            !dateStr.match(/^\d{2}-\d{2}-\d{4}/)) {
          // Não é um formato de data conhecido, mas não bloqueia
          logger.debug(`Formato de data não padrão no item ${index}: ${dateStr}`);
        }
      }

      // Valida formato de hora se existir
      if (item['Hora'] && typeof item['Hora'] === 'string') {
        const hourStr = item['Hora'].trim();
        if (hourStr && !hourStr.match(/^\d{2}:\d{2}/) && !hourStr.match(/^\d{2}:\d{2}:\d{2}/)) {
          logger.debug(`Formato de hora não padrão no item ${index}: ${hourStr}`);
        }
      }

      // Sanitiza strings muito longas (limite de 50000 caracteres do Google Sheets)
      Object.keys(item).forEach(key => {
        if (typeof item[key] === 'string' && item[key].length > 50000) {
          logger.warn(`Campo ${key} muito longo no item ${index}, truncando`);
          item[key] = item[key].substring(0, 50000) + '... [TRUNCADO]';
        }
      });

      validated.push(item);
    } catch (error) {
      invalid.push({ index, reason: error.message });
      logger.warn(`Erro ao validar item ${index}`, { error: error.message });
    }
  });

  if (invalid.length > 0) {
    logger.warn(`Validação: ${invalid.length} itens inválidos foram descartados`, {
      total: data.length,
      valid: validated.length,
      invalid: invalid.length,
      invalidItems: invalid.slice(0, 10) // Primeiros 10 para não sobrecarregar logs
    });
  }

  return {
    valid: validated,
    invalid: invalid,
    stats: {
      total: data.length,
      valid: validated.length,
      invalid: invalid.length,
      validPercentage: ((validated.length / data.length) * 100).toFixed(2)
    }
  };
}

/**
 * Valida dados de pausas antes de salvar
 */
export function validatePausasData(data) {
  if (!Array.isArray(data)) {
    throw new Error('Dados de pausas devem ser um array');
  }

  const validated = [];
  const invalid = [];

  data.forEach((item, index) => {
    try {
      // Validações básicas
      if (!item || typeof item !== 'object') {
        invalid.push({ index, reason: 'Item não é um objeto válido' });
        return;
      }

      // Valida campos obrigatórios (pelo menos um identificador deve existir)
      const hasIdentifier = item['Operador'] || item['Ramal'] || item['Event_id'] || item['Data Inicial'];
      
      if (!hasIdentifier) {
        invalid.push({ index, reason: 'Item sem identificador válido' });
        return;
      }

      // Valida formato de data se existir
      if (item['Data Inicial'] && typeof item['Data Inicial'] === 'string') {
        const dateStr = item['Data Inicial'].trim();
        if (dateStr && !dateStr.match(/^\d{4}-\d{2}-\d{2}/) && 
            !dateStr.match(/^\d{2}\/\d{2}\/\d{4}/) &&
            !dateStr.match(/^\d{2}-\d{2}-\d{4}/)) {
          logger.debug(`Formato de data não padrão no item ${index}: ${dateStr}`);
        }
      }

      // Sanitiza strings muito longas
      Object.keys(item).forEach(key => {
        if (typeof item[key] === 'string' && item[key].length > 50000) {
          logger.warn(`Campo ${key} muito longo no item ${index}, truncando`);
          item[key] = item[key].substring(0, 50000) + '... [TRUNCADO]';
        }
      });

      validated.push(item);
    } catch (error) {
      invalid.push({ index, reason: error.message });
      logger.warn(`Erro ao validar item ${index}`, { error: error.message });
    }
  });

  if (invalid.length > 0) {
    logger.warn(`Validação: ${invalid.length} itens inválidos foram descartados`, {
      total: data.length,
      valid: validated.length,
      invalid: invalid.length,
      invalidItems: invalid.slice(0, 10)
    });
  }

  return {
    valid: validated,
    invalid: invalid,
    stats: {
      total: data.length,
      valid: validated.length,
      invalid: invalid.length,
      validPercentage: ((validated.length / data.length) * 100).toFixed(2)
    }
  };
}


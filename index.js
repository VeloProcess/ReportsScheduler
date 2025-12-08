import axios from 'axios';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

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

// Nome da aba nas planilhas
const SHEET_TAB_NAME = 'Página1';

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
 * Calcula a data de ontem (D-1) no timezone de Brasília
 * Retorna objeto com startDate e endDate formatados para API
 */
function getYesterdayDates() {
  const now = new Date();
  const brtOffset = -3 * 60;
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brtNow = new Date(utc + (brtOffset * 60000));
  
  const yesterday = new Date(brtNow);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const startDate = formatDateForAPI(yesterday);
  
  const endDateObj = new Date(yesterday);
  endDateObj.setHours(23, 59, 59, 999);
  const endDate = formatDateForAPI(endDateObj);
  
  return { startDate, endDate };
}

// Função para obter datas de um dia específico (para testes)
function getSpecificDate(year, month, day) {
  const date = new Date(year, month - 1, day);
  const brtOffset = -3 * 60;
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const brtDate = new Date(utc + (brtOffset * 60000));
  
  brtDate.setHours(0, 0, 0, 0);
  const startDate = formatDateForAPI(brtDate);
  
  const endDateObj = new Date(brtDate);
  endDateObj.setHours(23, 59, 59, 999);
  const endDate = formatDateForAPI(endDateObj);
  
  return { startDate, endDate };
}

/**
 * Faz requisição GET na API do 55PBX
 */
async function fetchPBXData(reportType, startDate, endDate) {
  try {
    // Converte datas para formato da API se necessário
    let formattedStartDate = startDate;
    let formattedEndDate = endDate;
    
    // Se as datas vierem no formato YYYY-MM-DD, converte para formato da API
    // Importante: criar a data considerando o timezone de Brasília (-03:00)
    if (typeof startDate === 'string' && startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Cria data no timezone de Brasília (BRT = UTC-3)
      // Para 00:00:00 BRT, precisamos de 03:00:00 UTC
      const [year, month, day] = startDate.split('-');
      const start = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 3, 0, 0));
      formattedStartDate = formatDateForAPI(start);
    }
    
    if (typeof endDate === 'string' && endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Cria data no timezone de Brasília (BRT = UTC-3)
      // Para 23:59:59 BRT, precisamos de 02:59:59 UTC do dia seguinte
      const [year, month, day] = endDate.split('-');
      const end = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 26, 59, 59));
      formattedEndDate = formatDateForAPI(end);
    }
    
    // Converte reportType para formato da API (1 -> report_01, 2 -> report_02, 4 -> report_04)
    const reportTypeFormatted = reportType === '1' ? 'report_01' : 
                                (reportType === '2' ? 'report_02' : 
                                (reportType === '4' ? 'report_04' : `report_${reportType}`));
    
    const url = `${PBX_BASE_URL}/${formattedStartDate}/${formattedEndDate}/${PBX_QUEUE}/${PBX_NUMBER}/${PBX_AGENT}/${reportTypeFormatted}/${PBX_QUIZ_ID}/${PBX_TIMEZONE}`;
    
    
    const response = await axios.get(url, {
      headers: {
        'key': PBX_TOKEN,
        'Chave': PBX_TOKEN,
        'Content-Type': 'application/json'
      },
      // Adiciona timeout e tratamento de erros
      timeout: 30000,
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Aceita até 499 para ver erros da API
      }
    });
    
    // Verifica códigos de erro específicos da API
    if (response.status === 400) {
      throw new Error(`Erro 400: Parâmetro obrigatório faltando ou incorreto. Verifique os parâmetros da requisição.`);
    }
    if (response.status === 401) {
      throw new Error(`Erro 401: Falta de autorização. Verifique se o token está correto.`);
    }
    if (response.status === 404) {
      throw new Error(`Erro 404: Endpoint não encontrado. Verifique a URL da requisição.`);
    }
    if (response.status >= 500) {
      throw new Error(`Erro ${response.status}: Erro interno do 55PBX. Tente novamente mais tarde.`);
    }
    
    let dataToReturn = response.data;
    
    // Trata estruturas diferentes de resposta da API
    if (response.data && typeof response.data === 'object') {
      // Report_02 pode vir em data_report02
      if (response.data.data_report02) {
        dataToReturn = response.data.data_report02;
      }
      // Report_04 pode vir em data_report04
      else if (response.data.data_report04) {
        dataToReturn = response.data.data_report04;
      }
      // Pode vir em data ou results
      else if (response.data.data && Array.isArray(response.data.data)) {
        dataToReturn = response.data.data;
      }
      else if (response.data.results && Array.isArray(response.data.results)) {
        dataToReturn = response.data.results;
      }
    }
    
    return dataToReturn;
  } catch (error) {
    console.error(`Erro ao buscar dados do Report_${reportType}:`, error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Extrai tempo na URA de forma segura, ignorando valores inválidos como "Opcao - 1"
 * @param {object} item - Item da chamada da API
 * @returns {string} Tempo na URA ou string vazia
 */
function extractTempoNaUra(item) {
  // Prioriza call_time_URA que é o campo correto
  if (item.call_time_URA) {
    return item.call_time_URA;
  }
  
  // Se way_ura existir, verifica se é um tempo válido
  if (item.way_ura) {
    const wayUraStr = String(item.way_ura);
    // Verifica se é um formato de tempo válido (contém ":" ou é um número)
    // Ignora valores como "Opcao - 1", "Opcao - 2", etc.
    if (wayUraStr.includes(':') || /^\d+$/.test(wayUraStr.trim())) {
      return wayUraStr;
    }
  }
  
  return '';
}

/**
 * Filtra campos essenciais do Report_02 (Detalhes de Chamadas)
 * Report_01 retorna objeto agregado, Report_02 retorna array de detalhes
 * Campos conforme documentação: call_id, name, call_date, call_number, queue_name, etc.
 */
function transformChamadasData(data) {
  // Se for objeto com data_report02, extrai o array
  if (data && typeof data === 'object' && !Array.isArray(data) && data.data_report02) {
    data = data.data_report02;
  }
  
  if (Array.isArray(data)) {
    if (data.length === 0) return [];
    
    // Mapeia apenas para as colunas específicas da planilha de chamadas
    return data.map(item => {
      // Determina status da chamada baseado em type_call
      let statusChamada = '';
      if (item.type_call) {
        if (item.type_call === 'call_attended') statusChamada = 'Atendida';
        else if (item.type_call === 'call_abandoned' || item.type_call.includes('abandoned')) statusChamada = 'Abandonada';
        else if (item.type_call === 'call_retained_ura' || item.type_call.includes('retained')) statusChamada = 'Retida na URA';
        else if (item.type_call === 'call_refused') statusChamada = 'Recusada';
        else statusChamada = item.type_call;
      }
      
      // Busca nome da URA (pode ser wk_ivr_1_name, wk_ivr_2_name, etc.)
      let fluxoDeF = '';
      for (let i = 1; i <= 10; i++) {
        const key = `wk_ivr_${i}_name`;
        if (item[key]) {
          fluxoDeF = item[key];
          break;
        }
      }
      if (!fluxoDeF && item.wkivr_name) fluxoDeF = item.wkivr_name;
      
      // Formata data de atendimento (wl_attended_date pode ser Number ou String)
      let dataAten = '';
      if (item.wl_attended_date) {
        if (typeof item.wl_attended_date === 'number') {
          // Se for número, pode ser timestamp ou formato específico
          dataAten = String(item.wl_attended_date);
        } else {
          dataAten = item.wl_attended_date;
        }
      }
      
      // Formata hora de atendimento (wl_attended_hour pode ser Number ou String)
      let horaAten = '';
      if (item.wl_attended_hour) {
        if (typeof item.wl_attended_hour === 'number') {
          horaAten = String(item.wl_attended_hour).padStart(2, '0') + ':00';
        } else {
          horaAten = item.wl_attended_hour;
        }
      }
      
      // Busca URL do áudio e transcrições
      const audioETranscricoes = item.call_url_audio || '';
      
      // Busca fluxo de filas (transbordos) - pode ser array ou string
      let fluxoDeFilas = '';
      if (Array.isArray(item.wx_queue_overflow)) {
        fluxoDeFilas = item.wx_queue_overflow.length > 0 ? item.wx_queue_overflow.join('; ') : '';
      } else if (item.wx_queue_overflow) {
        fluxoDeFilas = String(item.wx_queue_overflow);
      }
      
      return {
        'Chamada': statusChamada,
        'Audio E Transcrições': audioETranscricoes,
        'Operador': item.name || '',
        'Data': item.call_date || '',
        'Hora': item.wb_call_hour || '',
        'Data Atendimento': dataAten,
        'Hora Atendimento': horaAten,
        'País': item.wf_states || '',
        'DDD': item.call_area_code || '',
        'Numero': item.call_number || '',
        'Fila': item.queue_name || '',
        'Tempo Na Ura': extractTempoNaUra(item),
        'Tempo De Espera': item.call_time_waiting || '',
        'Tempo Falado': item.call_time_spoken || '',
        'Tempo Total': item.call_time_total_duration || '',
        'Desconexão': item.call_disconnection || '',
        'Telefone Entrada': item.call_number_input || '',
        'Caminho U R A': fluxoDeF,
        'Cpf/Cnpj': item.call_document || '',
        'Pedido': item.call_order || '',
        'Id Ligação': item.call_id || '',
        'Id Ligação De Origem': item.call_id_origin || '',
        'I D Do Ticket': item.ws_ticket_id ? String(item.ws_ticket_id) : '',
        'Fluxo De Filas': fluxoDeFilas,
        'Wh_quality_reason': item.wh_call_quality || '',
        'Wh_humor_reason': item.wh_humor || '',
        'Questionário De Qualidade': item.wh_a_quiz_name || item.whquestion_ || '',
        'Pergunta2 1 PERGUNTA ATENDENTE': item.wh_question_2_1_PERGUNTA_ATENDENTE || item['wh_question_2_1_PERGUNTA_ATENDENTE'] || '',
        'Pergunta2 2 PERGUNTA SOLUCAO': item.wh_question_2_2_PERGUNTA_SOLUCAO || item['wh_question_2_2_PERGUNTA_SOLUCAO'] || ''
      };
    });
  }
  
  // Se for objeto, verifica se tem dados dentro
  if (data && typeof data === 'object') {
    // Verifica se é Report_01 (dados agregados) quando esperávamos Report_02
    if (data.totalData !== undefined || data.totalCallAttended !== undefined) {
      console.error('❌ ERRO: A API retornou dados agregados (Report_01) em vez de detalhes individuais (Report_02)');
      console.error('Report_02 deveria retornar um array de chamadas individuais, mas recebemos um objeto agregado.');
      console.error('Possíveis causas:');
      console.error('1. A API não suporta Report_02 para este período/filtros');
      console.error('2. Report_02 requer parâmetros adicionais ou endpoint diferente');
      console.error('3. Verifique a documentação da API para Report_02');
      return [];
    }
    
    if (data.data && Array.isArray(data.data)) {
      return data.data.map(item => {
        let statusChamada = '';
        if (item.type_call) {
          if (item.type_call === 'call_attended') statusChamada = 'Atendida';
          else if (item.type_call === 'call_abandoned' || item.type_call.includes('abandoned')) statusChamada = 'Abandonada';
          else if (item.type_call === 'call_retained_ura' || item.type_call.includes('retained')) statusChamada = 'Retida na URA';
          else if (item.type_call === 'call_refused') statusChamada = 'Recusada';
          else statusChamada = item.type_call;
        }
        
        let fluxoDeF = '';
        for (let i = 1; i <= 10; i++) {
          const key = `wk_ivr_${i}_name`;
          if (item[key]) {
            fluxoDeF = item[key];
            break;
          }
        }
        if (!fluxoDeF && item.wkivr_name) fluxoDeF = item.wkivr_name;
        
        let dataAten = '';
        if (item.wl_attended_date) {
          if (typeof item.wl_attended_date === 'number') {
            dataAten = String(item.wl_attended_date);
          } else {
            dataAten = item.wl_attended_date;
          }
        }
        
        let horaAten = '';
        if (item.wl_attended_hour) {
          if (typeof item.wl_attended_hour === 'number') {
            horaAten = String(item.wl_attended_hour).padStart(2, '0') + ':00';
          } else {
            horaAten = item.wl_attended_hour;
          }
        }
        
        return {
          'Chamada Audio E Tr': statusChamada,
          'Operador': item.name || '',
          'Data': item.call_date || '',
          'Hora': item.wb_call_hour || '',
          'Data Aten': dataAten,
          'Hora Aten': horaAten,
          'País': item.wf_states || '',
          'DDD': item.call_area_code || '',
          'Numero': item.call_number || '',
          'Fila': item.queue_name || '',
          'Tempo Na': extractTempoNaUra(item),
          'Tempo De': item.call_time_waiting || '',
          'Tempo Fa': item.call_time_spoken || '',
          'Tempo To': item.call_time_total_duration || '',
          'Desconex': item.call_disconnection || '',
          'Telefone': item.call_number_input || '',
          'E Caminho': item.call_id_origin || '',
          'ICpf/Cnpj': item.call_document || '',
          'Pedido': item.call_order || '',
          'Id Ligação': item.call_id || '',
          'I D Do Tick': item.ws_ticket_id ? String(item.ws_ticket_id) : '',
          'Fluxo De F': fluxoDeF,
          'Wh_qualit': item.wh_call_quality || '',
          'Wh_humc': item.wh_humor || '',
          'Questioná': item.wh_a_quiz_name || item.whquestion_ || '',
          'Pergunta2': item.wh_question_2_1_PERGUNTA_ATENDENTE || item['wh_question_2_1_PERGUNTA_ATENDENTE'] || item.wh_question_2_2_PERGUNTA_SOLUCAO || item['wh_question_2_2_PERGUNTA_SOLUCAO'] || ''
        };
      });
    }
    if (data.results && Array.isArray(data.results)) {
      return data.results.map(item => {
        let statusChamada = '';
        if (item.type_call) {
          if (item.type_call === 'call_attended') statusChamada = 'Atendida';
          else if (item.type_call === 'call_abandoned' || item.type_call.includes('abandoned')) statusChamada = 'Abandonada';
          else if (item.type_call === 'call_retained_ura' || item.type_call.includes('retained')) statusChamada = 'Retida na URA';
          else if (item.type_call === 'call_refused') statusChamada = 'Recusada';
          else statusChamada = item.type_call;
        }
        
        let fluxoDeF = '';
        for (let i = 1; i <= 10; i++) {
          const key = `wk_ivr_${i}_name`;
          if (item[key]) {
            fluxoDeF = item[key];
            break;
          }
        }
        if (!fluxoDeF && item.wkivr_name) fluxoDeF = item.wkivr_name;
        
        let dataAten = '';
        if (item.wl_attended_date) {
          if (typeof item.wl_attended_date === 'number') {
            dataAten = String(item.wl_attended_date);
          } else {
            dataAten = item.wl_attended_date;
          }
        }
        
        let horaAten = '';
        if (item.wl_attended_hour) {
          if (typeof item.wl_attended_hour === 'number') {
            horaAten = String(item.wl_attended_hour).padStart(2, '0') + ':00';
          } else {
            horaAten = item.wl_attended_hour;
          }
        }
        
        return {
          'Chamada Audio E Tr': statusChamada,
          'Operador': item.name || '',
          'Data': item.call_date || '',
          'Hora': item.wb_call_hour || '',
          'Data Aten': dataAten,
          'Hora Aten': horaAten,
          'País': item.wf_states || '',
          'DDD': item.call_area_code || '',
          'Numero': item.call_number || '',
          'Fila': item.queue_name || '',
          'Tempo Na': extractTempoNaUra(item),
          'Tempo De': item.call_time_waiting || '',
          'Tempo Fa': item.call_time_spoken || '',
          'Tempo To': item.call_time_total_duration || '',
          'Desconex': item.call_disconnection || '',
          'Telefone': item.call_number_input || '',
          'E Caminho': item.call_id_origin || '',
          'ICpf/Cnpj': item.call_document || '',
          'Pedido': item.call_order || '',
          'Id Ligação': item.call_id || '',
          'I D Do Tick': item.ws_ticket_id ? String(item.ws_ticket_id) : '',
          'Fluxo De F': fluxoDeF,
          'Wh_qualit': item.wh_call_quality || '',
          'Wh_humc': item.wh_humor || '',
          'Questioná': item.wh_a_quiz_name || item.whquestion_ || '',
          'Pergunta2': item.wh_question_2_1_PERGUNTA_ATENDENTE || item['wh_question_2_1_PERGUNTA_ATENDENTE'] || item.wh_question_2_2_PERGUNTA_SOLUCAO || item['wh_question_2_2_PERGUNTA_SOLUCAO'] || ''
        };
      });
    }
    return [];
  }
  
  return [];
}

/**
 * Filtra campos essenciais do Report_04 (Pausas/Ações do Operador)
 * Campos conforme documentação: name, branch, queue_name, time, event, date, hour_start, date_end, hour_end, duration, pause_reason, pause_id, difTime, quantity
 */
function transformPausasData(data) {
  // Se for objeto, verifica estruturas possíveis (similar ao Report_02)
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    // Verifica se tem data_report04 ou outras estruturas
    if (data.data_report04 && Array.isArray(data.data_report04)) {
      data = data.data_report04;
    } else if (data.data && Array.isArray(data.data)) {
      data = data.data;
    } else if (data.results && Array.isArray(data.results)) {
      data = data.results;
    } else {
      // Se não for array, retorna vazio
      console.log('⚠️ Dados de pausas não estão em formato de array. Estrutura recebida:', Object.keys(data));
      return [];
    }
  }
  
  if (!Array.isArray(data)) {
    console.log('⚠️ Dados de pausas não são um array. Tipo:', typeof data);
    return [];
  }
  
  if (data.length === 0) {
    console.log('⚠️ Array de pausas está vazio');
    return [];
  }
  
  console.log(`📊 Processando ${data.length} registro(s) de pausas...`);
  
  // Mapeia APENAS campos específicos de PAUSAS (Report_04)
  // NÃO misturar com campos de CHAMADAS (Report_02)
  // Nomes das colunas conforme SCHEMA.md
  return data.map(item => {
    return {
      'Operador': item.name || '',
      'Wz_branchNumber_id': Array.isArray(item.wz_branchNumber_id) ? item.wz_branchNumber_id.join('; ') : (item.wz_branchNumber_id || ''),
      'Event_id': item.pause_id || item.event_id || '',
      'Ramal': item.branch || '', // APENAS branch, sem fallback para branch_number
      'Number': item.number || '',
      'User_email': item.wy_branch_email_agent || item.user_email || '',
      'Fila': item.queue_name || '',
      'Queue_id': item.queue_id || '', // APENAS queue_id, sem fallback para wx_queue_id ou ramal
      'Time': item.time || '',
      'Atividade': item.event || '',
      'Data Inicial': item.date || '',
      'Horário Início': item.hour_start || '',
      'Data Final': item.date_end || '',
      'Horário Fim': item.hour_end || '',
      'Duração': item.duration || '',
      'Motivo Da Pausa': item.pause_reason || '',
      'Tempo Restante': item.difTime || '',
      'Quantidade': item.quantity || ''
    };
  });
}

/**
 * Autentica e adiciona dados no Google Sheets
 */
async function saveToGoogleSheets(sheetId, data) {
  if (!data || data.length === 0) return;
  
  console.log(`  Conectando à planilha ID: ${sheetId}`);
  
  const auth = new JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  const doc = new GoogleSpreadsheet(sheetId, auth);
  await doc.loadInfo();
  console.log(`  Planilha: ${doc.title}`);
  
  const sheet = doc.sheetsByTitle[SHEET_TAB_NAME];
  if (!sheet) {
    throw new Error(`Aba "${SHEET_TAB_NAME}" não encontrada na planilha ${doc.title}`);
  }
  console.log(`  Aba: ${sheet.title}`);
  
  // Se a planilha estiver vazia ou não tiver cabeçalhos, cria automaticamente
  let hasHeaders = false;
  try {
    await sheet.loadHeaderRow();
    hasHeaders = true;
  } catch (error) {
    // Se não houver cabeçalhos, cria usando as chaves do primeiro registro
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      // Redimensiona a planilha para caber todas as colunas
      await sheet.resize({ rowCount: 1, columnCount: headers.length });
      await sheet.setHeaderRow(headers);
      hasHeaders = true;
    }
  }
  
  // Se ainda não tem cabeçalhos mas tem dados, cria
  if (!hasHeaders && data.length > 0) {
    const headers = Object.keys(data[0]);
    await sheet.resize({ rowCount: 1, columnCount: headers.length });
    await sheet.setHeaderRow(headers);
  }
  
  // Adiciona as linhas diretamente
  await sheet.addRows(data);
}

/**
 * Processa Report_02 (Detalhes de Chamadas)
 * Report_01 retorna dados agregados, Report_02 retorna detalhes individuais
 */
async function processChamadas(startDate, endDate) {
  try {
    console.log('Processando Report_02 (Chamadas)...');
    console.log(`Planilha de destino: ${SHEET_CHAMADAS_ID}`);
    
    const rawData = await fetchPBXData('2', startDate, endDate);
    const transformedData = transformChamadasData(rawData);
    
    if (transformedData.length > 0) {
      console.log(`Salvando ${transformedData.length} chamada(s) na planilha de CHAMADAS...`);
      await saveToGoogleSheets(SHEET_CHAMADAS_ID, transformedData);
      console.log(`✅ ${transformedData.length} chamada(s) salva(s) na planilha de CHAMADAS`);
    } else {
      console.log('⚠️ Nenhuma chamada encontrada no período');
    }
  } catch (error) {
    console.error('❌ Erro ao processar chamadas:', error.message);
    throw error;
  }
}

/**
 * Processa Report_04 (Pausas)
 */
async function processPausas(startDate, endDate) {
  try {
    console.log('Processando Report_04 (Pausas)...');
    console.log(`Planilha de destino: ${SHEET_PAUSAS_ID}`);
    
    const rawData = await fetchPBXData('4', startDate, endDate);
    
    // Debug: mostra estrutura dos dados recebidos
    console.log('📋 Tipo de dados recebidos:', Array.isArray(rawData) ? 'Array' : typeof rawData);
    if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
      console.log('📋 Chaves do objeto:', Object.keys(rawData));
      if (rawData.data_report04) {
        console.log('📋 data_report04 encontrado, tipo:', Array.isArray(rawData.data_report04) ? 'Array' : typeof rawData.data_report04);
        console.log('📋 Quantidade de itens:', Array.isArray(rawData.data_report04) ? rawData.data_report04.length : 'N/A');
      }
    } else if (Array.isArray(rawData)) {
      console.log('📋 Array recebido diretamente, quantidade:', rawData.length);
      if (rawData.length > 0) {
        console.log('📋 Primeiro item (amostra):', JSON.stringify(rawData[0], null, 2).substring(0, 800));
        // Debug específico dos campos que podem estar faltando
        const firstItem = rawData[0];
        console.log('📋 Campos específicos:');
        console.log('  - date:', firstItem.date);
        console.log('  - hour_start:', firstItem.hour_start);
        console.log('  - hour_end:', firstItem.hour_end);
        console.log('  - pause_reason:', firstItem.pause_reason);
      }
    }
    
    const transformedData = transformPausasData(rawData);
    
    // Debug: verifica se os campos foram transformados corretamente
    if (transformedData.length > 0) {
      console.log('📋 Primeiro item transformado (amostra):');
      const firstTransformed = transformedData[0];
      console.log('  - Data Inicial:', firstTransformed['Data Inicial']);
      console.log('  - Horário Inicial:', firstTransformed['Horário Inicial']);
      console.log('  - Horário Fim:', firstTransformed['Horário Fim']);
      console.log('  - Motivo Da Pausa:', firstTransformed['Motivo Da Pausa']);
      console.log('📋 Todas as chaves do item transformado:', Object.keys(firstTransformed));
    }
    
    if (transformedData.length > 0) {
      console.log(`Salvando ${transformedData.length} pausa(s) na planilha de PAUSAS...`);
      await saveToGoogleSheets(SHEET_PAUSAS_ID, transformedData);
      console.log(`✅ ${transformedData.length} pausa(s) salva(s) na planilha de PAUSAS`);
    } else {
      console.log('⚠️ Nenhuma pausa encontrada no período');
    }
  } catch (error) {
    console.error('❌ Erro ao processar pausas:', error.message);
    throw error;
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log('=== ETL 55PBX ===');
    console.log(`Data: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    
    // Validação de variáveis de ambiente
    if (!PBX_TOKEN) throw new Error('PBX_TOKEN não configurado');
    if (!SHEET_CHAMADAS_ID) throw new Error('SHEET_CHAMADAS_ID não configurado');
    if (!SHEET_PAUSAS_ID) throw new Error('SHEET_PAUSAS_ID não configurado');
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL não configurado');
    if (!GOOGLE_PRIVATE_KEY) throw new Error('GOOGLE_PRIVATE_KEY não configurado');
    
    // Para teste: usar dia 5 de dezembro de 2025
    // Descomente a linha abaixo para testar dia específico:
    // const { startDate, endDate } = getSpecificDate(2025, 12, 5);
    // Comente a linha abaixo quando quiser voltar ao padrão (ontem):
    // Para teste: usando dia 5 de dezembro de 2025
    const { startDate, endDate } = getSpecificDate(2025, 12, 5);
    // Para voltar ao padrão (ontem), descomente a linha abaixo:
    // const { startDate, endDate } = getYesterdayDates();
    console.log(`Período: ${decodeURIComponent(startDate)} até ${decodeURIComponent(endDate)}\n`);
    
    await processChamadas(startDate, endDate);
    await processPausas(startDate, endDate);
    
    console.log('\n✅ ETL concluído com sucesso!');
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    process.exit(1);
  }
}

// Exporta funções para uso em outros módulos
export { fetchPBXData, transformChamadasData, transformPausasData, getYesterdayDates, formatDateForAPI, processChamadas, processPausas };

// Executa o script apenas se for executado diretamente (não quando importado)
// Usa uma verificação mais segura para evitar erros quando importado
try {
  const isMainModule = import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}` || 
                       (process.argv && process.argv[1] && process.argv[1].endsWith('index.js'));
  
  if (isMainModule) {
    main();
  }
} catch (error) {
  // Se houver erro na verificação, não executa (provavelmente está sendo importado)
  // Não faz nada, apenas permite que o módulo seja importado normalmente
}


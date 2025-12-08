# Schema de Dados - Extração 55PBX

Este documento mapeia as colunas das planilhas e os campos extraídos da API 55PBX.

---

## 📋 Report_02 - Chamadas (Detalhes de Chamadas)

| # | Status | Coluna na Planilha | Campo Extraído da API 55PBX | Transformação Aplicada | Observações |
|---|--------|-------------------|----------------------------|----------------------|-------------|
| 1 | ✅ **USA** | **Chamada** | `type_call` | `call_attended` → "Atendida"<br>`call_abandoned` → "Abandonada"<br>`call_retained_ura` → "Retida na URA"<br>`call_refused` → "Recusada"<br>Outros → valor original | Status da chamada |
| 2 | ❌ **NÃO USA** | **Audio E Transcrições** | `call_url_audio` | - | URL do áudio e transcrições |
| 3 | ✅ **USA** | **Operador** | `name` | - | Nome do operador/atendente |
| 4 | ✅ **USA** | **Data** | `call_date` | - | Data da chamada |
| 5 | ✅ **USA** | **Hora** | `wb_call_hour` | - | Hora da chamada |
| 6 | ✅ **USA** | **Data Atendimento** | `wl_attended_date` | Se número → converte para String | Data de atendimento |
| 7 | ✅ **USA** | **Hora Atendimento** | `wl_attended_hour` | Se número → formata como "HH:00" | Hora de atendimento |
| 8 | ✅ **USA** | **País** | `wf_states` | - | País/Estado |
| 9 | ✅ **USA** | **DDD** | `call_area_code` | - | Código de área (DDD) |
| 10 | ✅ **USA** | **Numero** | `call_number` | - | Número do telefone |
| 11 | ✅ **USA** | **Fila** | `queue_name` | - | Nome da fila |
| 12 | ✅ **USA** | **Tempo Na Ura** | `call_time_URA` (prioritário) ou `way_ura` (se válido) | Prioriza `call_time_URA`. Se não existir, usa `way_ura` apenas se for formato de tempo válido (contém ":" ou é número). Ignora valores inválidos como "Opcao - 1" | Tempo na URA |
| 13 | ✅ **USA** | **Tempo De Espera** | `call_time_waiting` | - | Tempo de espera |
| 14 | ✅ **USA** | **Tempo Falado** | `call_time_spoken` | - | Tempo falado |
| 15 | ✅ **USA** | **Tempo Total** | `call_time_total_duration` | - | Duração total da chamada |
| 16 | ❌ **NÃO USA** | **Desconexão** | `call_disconnection` | - | Tipo de desconexão |
| 17 | ✅ **USA** | **Telefone Entrada** | `call_number_input` | - | Telefone de entrada |
| 18 | ❌ **NÃO USA** | **Caminho U R A** | `wk_ivr_1_name` até `wk_ivr_10_name` ou `wkivr_name` | Busca sequencial de `wk_ivr_1_name` até `wk_ivr_10_name`, fallback para `wkivr_name` | Fluxo da URA |
| 19 | ❌ **NÃO USA** | **Cpf/Cnpj** | `call_document` | - | CPF/CNPJ |
| 20 | ❌ **NÃO USA** | **Pedido** | `call_order` | - | Número do pedido |
| 21 | ❌ **NÃO USA** | **Id Ligação** | `call_id` | - | ID único da ligação |
| 22 | ❌ **NÃO USA** | **Id Ligação De Origem** | `call_id_origin` | - | ID da ligação de origem |
| 23 | ❌ **NÃO USA** | **I D Do Ticket** | `ws_ticket_id` | Converte para String | ID do ticket |
| 24 | ❌ **NÃO USA** | **Fluxo De Filas** | `wx_queue_overflow` | Se array → junta com "; " | Transbordos entre filas |
| 25 | ❌ **NÃO USA** | **Wh_quality_reason** | `wh_call_quality` | - | Motivo da qualidade |
| 26 | ❌ **NÃO USA** | **Wh_humor_reason** | `wh_humor` | - | Humor do atendimento |
| 27 | ❌ **NÃO USA** | **Questionário De Qualidade** | `wh_a_quiz_name` ou `whquestion_` | Fallback: usa `whquestion_` se `wh_a_quiz_name` não existir | Nome do questionário |
| 28 | ✅ **USA** | **Pergunta2 1 PERGUNTA ATENDENTE** | `wh_question_2_1_PERGUNTA_ATENDENTE` ou `wh_question_2_1_PERGUNTA_ATENDENTE` (com colchetes) | Tenta ambos os formatos | Pergunta sobre atendente |
| 29 | ✅ **USA** | **Pergunta2 2 PERGUNTA SOLUCAO** | `wh_question_2_2_PERGUNTA_SOLUCAO` ou `wh_question_2_2_PERGUNTA_SOLUCAO` (com colchetes) | Tenta ambos os formatos | Pergunta sobre solução |

---

## 📋 Report_04 - Pausas (Ações do Operador)

| # | Coluna na Planilha | Campo Extraído da API 55PBX | Transformação Aplicada | Observações |
|---|-------------------|----------------------------|----------------------|-------------|
| 1 | **Operador** | `name` | - | Nome do operador |
| 2 | **Wz_branchNumber_id** | `wz_branchNumber_id` | Se array → junta com "; " | ID do ramal |
| 3 | **Event_id** | `pause_id` ou `event_id` | Fallback: usa `event_id` se `pause_id` não existir | ID do evento/pausa |
| 4 | **Ramal** | `branch` | - | Número do ramal (APENAS branch, sem misturar com queue_id) |
| 5 | **Number** | `number` | - | Número |
| 6 | **User_email** | `wy_branch_email_agent` ou `user_email` | Fallback: usa `user_email` se `wy_branch_email_agent` não existir | Email do usuário |
| 7 | **Fila** | `queue_name` | - | Nome da fila |
| 8 | **Queue_id** | `queue_id` | - | ID da fila (APENAS queue_id, sem misturar com ramal) |
| 9 | **Time** | `time` | - | Tempo |
| 10 | **Atividade** | `event` | - | Tipo de atividade/evento |
| 11 | **Data Inicial** | `date` | - | Data inicial |
| 12 | **Horário Inicial** | `hour_start` | - | Horário de início |
| 13 | **Data Final** | `date_end` | - | Data final |
| 14 | **Horário Fim** | `hour_end` | - | Horário de fim |
| 15 | **Duração** | `duration` | - | Duração da pausa |
| 16 | **Motivo Da Pausa** | `pause_reason` | - | Motivo da pausa |
| 17 | **Tempo Restante** | `difTime` | - | Tempo Restante de Pausa |
| 18 | **Quantidade** | `quantity` | - | Quantidade de Pausas (atual/total) |

---

## 📝 Resumo - Colunas Utilizadas

### Report_02 - Chamadas
**✅ Colunas USADAS (17 colunas):**
- 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 28, 29

**❌ Colunas NÃO USADAS (12 colunas):**
- 2, 16, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27

### Report_04 - Pausas
**✅ Todas as 18 colunas são utilizadas**

---

## 📝 Observações Gerais

### Tratamento de Valores Vazios
- Todos os campos retornam string vazia (`''`) quando o valor não existe na API
- Arrays são convertidos para strings separadas por `"; "` quando necessário

### Estrutura da Resposta da API
- **Report_02**: Pode retornar array direto ou objeto com `data_report02`, `data` ou `results`
- **Report_04**: Retorna array direto

### Campos Calculados/Transformados
- **Chamada**: Status calculado a partir de `type_call`
- **Data/Hora Atendimento**: Conversão de número para string quando necessário

---

## 🔍 Endpoint da API

```
GET https://reportapi02.55pbx.com:50500/api/pbx/reports/metrics/{date_start}/{date_end}/{queue}/{number}/{agent}/{report}/{quiz_id}/{timezone}
```

### Parâmetros Padrão
- `queue`: `all_queues`
- `number`: `all_numbers`
- `agent`: `all_agent`
- `report`: `report_02` (Chamadas) ou `report_04` (Pausas)
- `quiz_id`: `undefined`
- `timezone`: `-3`


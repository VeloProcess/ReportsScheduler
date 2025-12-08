// Configura data padrão (ontem)
function setDefaultDates() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    document.getElementById('start-date').value = dateStr;
    document.getElementById('end-date').value = dateStr;
}

// Atualiza data e hora atual
function updateDateTime() {
    const now = new Date();
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false
    };
    
    const dateStr = now.toLocaleDateString('pt-BR', dateOptions);
    const timeStr = now.toLocaleTimeString('pt-BR', timeOptions);
    document.getElementById('current-date').textContent = dateStr;
    document.getElementById('current-time').textContent = timeStr;
}

// Atualiza a cada segundo
setInterval(updateDateTime, 1000);
updateDateTime();

// Inicializa datas ao carregar
setDefaultDates();

// --- 🎬 EFEITO MATRIX 🎬 ---
// Variáveis globais para o efeito Matrix (devem ser declaradas antes de serem usadas)
let matrixAnimation = null;
let matrixCanvas = null;
let matrixCtx = null;
let matrixChars = [];
let matrixFontSize = 14;
let resizeHandler = null;

// --- 🎨 GERENCIAMENTO DE TEMAS 🎨 ---

// Carrega tema salvo ou usa padrão
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.value = savedTheme;
    }
    changeTheme(savedTheme);
}

// Alterna tema
function changeTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.value = theme;
    }
    localStorage.setItem('theme', theme);
    
    // Garante que o scroll sempre funcione
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    // Inicia/para efeito Matrix conforme tema
    if (theme === 'matrix') {
        initMatrix();
    } else {
        stopMatrix();
    }
}

// Inicializa tema ao carregar
loadTheme();

function initMatrix() {
    if (matrixAnimation) return; // Já está rodando
    
    matrixCanvas = document.getElementById('matrix-canvas');
    if (!matrixCanvas) return;
    
    // Garante que o canvas não bloqueie eventos
    matrixCanvas.style.pointerEvents = 'none';
    matrixCanvas.setAttribute('style', 'pointer-events: none !important;');
    
    matrixCtx = matrixCanvas.getContext('2d');
    
    // Ajusta tamanho do canvas
    function resizeCanvas() {
        if (matrixCanvas) {
            matrixCanvas.width = window.innerWidth;
            matrixCanvas.height = window.innerHeight;
        }
    }
    resizeCanvas();
    
    // Remove listener anterior se existir
    if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
    }
    resizeHandler = resizeCanvas;
    window.addEventListener('resize', resizeHandler);
    
    // Garante que eventos de scroll passem através
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    // Caracteres Matrix (números, letras, símbolos)
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const charArray = chars.split('');
    
    // Cria colunas de caracteres
    const columns = Math.floor(matrixCanvas.width / matrixFontSize);
    matrixChars = [];
    
    for (let i = 0; i < columns; i++) {
        matrixChars[i] = {
            y: Math.random() * -1000, // Começa em posições aleatórias acima
            speed: Math.random() * 2 + 1,
            chars: []
        };
        
        // Cria sequência de caracteres para esta coluna
        const length = Math.floor(Math.random() * 20) + 10;
        for (let j = 0; j < length; j++) {
            matrixChars[i].chars.push({
                char: charArray[Math.floor(Math.random() * charArray.length)],
                opacity: Math.random()
            });
        }
    }
    
    // Anima
    function animate() {
        matrixCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
        
        matrixCtx.fillStyle = '#00ff41';
        matrixCtx.font = matrixFontSize + 'px monospace';
        
        for (let i = 0; i < matrixChars.length; i++) {
            const column = matrixChars[i];
            const x = i * matrixFontSize;
            
            // Desenha caracteres da coluna
            for (let j = 0; j < column.chars.length; j++) {
                const charObj = column.chars[j];
                const y = column.y + (j * matrixFontSize);
                
                if (y > 0 && y < matrixCanvas.height) {
                    // Primeiro caractere mais brilhante
                    const opacity = j === 0 ? 1 : Math.max(0.1, charObj.opacity - (j * 0.1));
                    matrixCtx.fillStyle = `rgba(0, 255, 65, ${opacity})`;
                    matrixCtx.fillText(charObj.char, x, y);
                }
            }
            
            // Move coluna para baixo
            column.y += column.speed;
            
            // Reseta quando sai da tela
            if (column.y > matrixCanvas.height + (column.chars.length * matrixFontSize)) {
                column.y = -column.chars.length * matrixFontSize;
                // Regera caracteres ocasionalmente
                if (Math.random() > 0.95) {
                    const length = Math.floor(Math.random() * 20) + 10;
                    column.chars = [];
                    for (let j = 0; j < length; j++) {
                        column.chars.push({
                            char: charArray[Math.floor(Math.random() * charArray.length)],
                            opacity: Math.random()
                        });
                    }
                }
            }
        }
        
        matrixAnimation = requestAnimationFrame(animate);
    }
    
    animate();
}

function stopMatrix() {
    if (matrixAnimation) {
        cancelAnimationFrame(matrixAnimation);
        matrixAnimation = null;
    }
    
    // Remove listener de resize
    if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        resizeHandler = null;
    }
    
    if (matrixCtx && matrixCanvas) {
        matrixCtx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    }
    
    // Limpa variáveis
    matrixChars = [];
}

// Estado do scheduler
let schedulerNextExecution = null;

// Carrega status do scheduler
async function loadSchedulerStatus() {
    try {
        const response = await fetch('/api/scheduler/status');
        
        // Verifica se a resposta é JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Resposta não é JSON do status:', text.substring(0, 500));
            return;
        }
        
        if (response.ok) {
            const status = await response.json();
            
            // Atualiza UI do scheduler
            const statusBadge = document.getElementById('scheduler-status-badge');
            const statusText = document.getElementById('scheduler-status-text');
            const statusDot = document.getElementById('scheduler-status-dot');
            const scheduleText = document.getElementById('scheduler-schedule');
            const lastExecText = document.getElementById('scheduler-last-exec');
            const btnStart = document.getElementById('btn-start-scheduler');
            const btnStop = document.getElementById('btn-stop-scheduler');
            
            if (status.isActive) {
                statusBadge.className = 'status-badge active';
                statusText.textContent = 'Ativo';
                btnStart.style.display = 'none';
                btnStop.style.display = 'inline-block';
                scheduleText.textContent = `Agendamento: ${status.schedule || '0 0 * * *'} (Diariamente às 00:00)`;
            } else {
                statusBadge.className = 'status-badge inactive';
                statusText.textContent = 'Inativo';
                btnStart.style.display = 'inline-block';
                btnStop.style.display = 'none';
                scheduleText.textContent = 'Scheduler não está ativo';
            }
            
            if (status.lastExecution) {
                const lastExecDate = new Date(status.lastExecution.startTime);
                lastExecText.textContent = `Última execução: ${lastExecDate.toLocaleString('pt-BR')} ${status.lastExecution.success ? '✅' : '❌'}`;
            } else {
                lastExecText.textContent = 'Última execução: Nenhuma';
            }
            
            // Atualiza próxima execução para contagem regressiva
            schedulerNextExecution = status.nextExecution ? new Date(status.nextExecution) : null;
            
            // Atualiza estatísticas
            if (status.lastExecution) {
                document.getElementById('chamadas-count').textContent = status.lastExecution.chamadasCount || '-';
                document.getElementById('pausas-count').textContent = status.lastExecution.pausasCount || '-';
                if (status.lastExecution.startTime) {
                    const execDate = new Date(status.lastExecution.startTime);
                    document.getElementById('last-execution').textContent = execDate.toLocaleString('pt-BR');
                    document.getElementById('period-processed').textContent = execDate.toLocaleDateString('pt-BR');
                }
            }
        }
    } catch (error) {
        console.error('Erro ao carregar status do scheduler:', error);
    }
}

// Inicia o scheduler
async function startScheduler() {
    try {
        showLoading();
        const response = await fetch('/api/scheduler/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schedule: '0 0 * * *' })
        });
        
        // Verifica se a resposta é JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Resposta não é JSON:', text.substring(0, 500));
            hideLoading();
            alert('❌ Erro: Servidor retornou resposta inválida. Verifique o console para mais detalhes.');
            return;
        }
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            alert('✅ Scheduler iniciado com sucesso!');
            await loadSchedulerStatus();
        } else {
            alert(`❌ Erro: ${result.message || result.error}`);
        }
    } catch (error) {
        hideLoading();
        console.error('Erro completo:', error);
        alert(`❌ Erro ao iniciar scheduler: ${error.message}`);
    }
}

// Para o scheduler
async function stopScheduler() {
    if (!confirm('Tem certeza que deseja parar o scheduler?')) {
        return;
    }
    
    try {
        showLoading();
        const response = await fetch('/api/scheduler/stop', {
            method: 'POST'
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            alert('✅ Scheduler parado com sucesso!');
            await loadSchedulerStatus();
        } else {
            alert(`❌ Erro: ${result.message || result.error}`);
        }
    } catch (error) {
        hideLoading();
        alert(`❌ Erro ao parar scheduler: ${error.message}`);
    }
}

// Executa ETL manualmente
async function runManualETL() {
    if (!confirm('Deseja executar o ETL agora? Isso processará os dados de ontem.')) {
        return;
    }
    
    try {
        showLoading();
        const response = await fetch('/api/scheduler/run', {
            method: 'POST'
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            alert('✅ Execução manual iniciada! Verifique os logs do servidor para acompanhar o progresso.');
            // Aguarda um pouco e atualiza o status
            setTimeout(() => {
                loadSchedulerStatus();
                loadStats();
            }, 2000);
        } else {
            alert(`❌ Erro: ${result.message || result.error}`);
        }
    } catch (error) {
        hideLoading();
        alert(`❌ Erro ao executar manualmente: ${error.message}`);
    }
}

// Configuração do próximo cronjob
function getNextCronjobTime() {
    // Se temos informação do scheduler, usa ela
    if (schedulerNextExecution) {
        return schedulerNextExecution;
    }
    
    // Senão, calcula para meia-noite do próximo dia
    const now = new Date();
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    return next;
}

// Contagem regressiva para próximo cronjob
function updateCountdown() {
    const now = new Date();
    const nextCronjob = getNextCronjobTime();
    
    if (!nextCronjob) {
        document.getElementById('hours').textContent = '--';
        document.getElementById('minutes').textContent = '--';
        document.getElementById('seconds').textContent = '--';
        document.getElementById('next-execution-time').textContent = 'Scheduler não está ativo';
        return;
    }
    
    const diff = nextCronjob - now;
    
    if (diff <= 0) {
        // Se já passou, recalcula
        const newNext = getNextCronjobTime();
        const newDiff = newNext - now;
        updateCountdownDisplay(newDiff, newNext);
        return;
    }
    
    updateCountdownDisplay(diff, nextCronjob);
}

function updateCountdownDisplay(diff, nextCronjob) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    
    if (nextCronjob) {
        const nextTimeStr = nextCronjob.toLocaleString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo'
        });
        document.getElementById('next-execution-time').textContent = 
            `Agendado para: ${nextTimeStr}`;
    }
}

// Atualiza contagem regressiva a cada segundo
setInterval(updateCountdown, 1000);
updateCountdown();

// Carrega estatísticas do servidor
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        if (response.ok) {
            const data = await response.json();
            if (data.chamadas !== undefined) {
                document.getElementById('chamadas-count').textContent = data.chamadas.toLocaleString('pt-BR');
            }
            if (data.pausas !== undefined) {
                document.getElementById('pausas-count').textContent = data.pausas.toLocaleString('pt-BR');
            }
            if (data.lastExecution) {
                document.getElementById('last-execution').textContent = 
                    new Date(data.lastExecution).toLocaleString('pt-BR');
            }
            if (data.periodProcessed) {
                document.getElementById('period-processed').textContent = data.periodProcessed;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Carrega estatísticas e status do scheduler ao iniciar
loadStats();
loadSchedulerStatus();

// Recarrega a cada 30 segundos
setInterval(() => {
    loadStats();
    loadSchedulerStatus();
}, 30 * 1000);

// Mostra/esconde loading
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Formata JSON para exibição
function formatJSON(obj) {
    return JSON.stringify(obj, null, 2);
}

// Testa conexão com API 55PBX
async function testPBX() {
    const reportType = document.getElementById('report-type').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const resultBox = document.getElementById('pbx-result');
    
    if (!startDate || !endDate) {
        resultBox.className = 'result-box error';
        resultBox.innerHTML = '<h3>❌ Erro</h3><p>Por favor, preencha ambas as datas.</p>';
        resultBox.style.display = 'block';
        return;
    }
    
    showLoading();
    resultBox.style.display = 'none';
    
    try {
        const response = await fetch('/api/test/pbx', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reportType, startDate, endDate })
        });
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Resposta não é JSON:', text.substring(0, 500));
            throw new Error(`Servidor retornou ${contentType} em vez de JSON. Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            resultBox.className = 'result-box success';
            const reportType = document.getElementById('report-type').value;
            const isReport01 = reportType === '1';
            const isReport02 = reportType === '2';
            
            let countMessage = `<p><strong>Registros encontrados:</strong> ${data.dataCount.toLocaleString('pt-BR')}</p>`;
            if (isReport01 && data.dataCount === 0) {
                countMessage += `<p style="color: #f59e0b; margin-top: 10px;"><strong>ℹ️ Nota:</strong> Report_01 retorna dados agregados (métricas), não detalhes individuais. Use Report_02 para detalhes de chamadas.</p>`;
            } else if (isReport02 && data.dataCount === 0) {
                countMessage += `<p style="color: #ef4444; margin-top: 10px;"><strong>⚠️ Atenção:</strong> Nenhum dado encontrado para o período especificado.</p>`;
            }
            
            resultBox.innerHTML = `
                <h3>✅ Conexão Bem-sucedida!</h3>
                <p><strong>Endpoint:</strong> ${data.url}</p>
                ${countMessage}
                <p><strong>Tipo de dados:</strong> ${data.isArray ? 'Array' : 'Objeto'}</p>
                ${data.objectKeys ? `<p><strong>Chaves do objeto:</strong> ${data.objectKeys.join(', ')}</p>` : ''}
                <details>
                    <summary style="cursor: pointer; margin-top: 12px; font-weight: 600;">Ver resposta completa</summary>
                    <pre>${formatJSON(data.fullData)}</pre>
                </details>
                ${data.sampleData ? `
                    <details>
                        <summary style="cursor: pointer; margin-top: 12px; font-weight: 600;">Ver exemplo de registro</summary>
                        <pre>${formatJSON(data.sampleData)}</pre>
                    </details>
                ` : ''}
            `;
        } else {
            resultBox.className = 'result-box error';
            resultBox.innerHTML = `
                <h3>❌ Falha na Conexão</h3>
                <p><strong>Erro:</strong> ${data.error}</p>
                ${data.status ? `<p><strong>Status HTTP:</strong> ${data.status}</p>` : ''}
                ${data.details ? `<pre>${formatJSON(data.details)}</pre>` : ''}
            `;
        }
    } catch (error) {
        resultBox.className = 'result-box error';
        resultBox.innerHTML = `
            <h3>❌ Erro</h3>
            <p>${error.message}</p>
        `;
    } finally {
        hideLoading();
        resultBox.style.display = 'block';
    }
}

// Testa conexão com Google Sheets
async function testSheets() {
    const sheetType = document.getElementById('sheet-type').value;
    const resultBox = document.getElementById('sheets-result');
    
    showLoading();
    resultBox.style.display = 'none';
    
    try {
        const response = await fetch('/api/test/sheets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sheetType })
        });
        
        const data = await response.json();
        
        if (data.success) {
            resultBox.className = 'result-box success';
            resultBox.innerHTML = `
                <h3>✅ Conexão Bem-sucedida!</h3>
                <p><strong>Planilha:</strong> ${data.title}</p>
                <p><strong>ID:</strong> ${data.sheetId}</p>
                <p><strong>Abas encontradas:</strong> ${data.sheets.length}</p>
                <details>
                    <summary style="cursor: pointer; margin-top: 12px; font-weight: 600;">Ver informações das abas</summary>
                    <pre>${formatJSON(data.sheets)}</pre>
                </details>
                ${data.currentSheet ? `
                    <p style="margin-top: 12px;"><strong>Aba atual:</strong> ${data.currentSheet.title}</p>
                    <p><strong>Linhas:</strong> ${data.currentSheet.rowCount.toLocaleString('pt-BR')}</p>
                    <p><strong>Colunas:</strong> ${data.currentSheet.headers.length}</p>
                    <details>
                        <summary style="cursor: pointer; margin-top: 12px; font-weight: 600;">Ver cabeçalhos</summary>
                        <pre>${formatJSON(data.currentSheet.headers)}</pre>
                    </details>
                    ${data.currentSheet.sampleRows.length > 0 ? `
                        <details>
                            <summary style="cursor: pointer; margin-top: 12px; font-weight: 600;">Ver exemplos de linhas (primeiras 5)</summary>
                            <pre>${formatJSON(data.currentSheet.sampleRows)}</pre>
                        </details>
                    ` : ''}
                ` : ''}
            `;
        } else {
            resultBox.className = 'result-box error';
            resultBox.innerHTML = `
                <h3>❌ Falha na Conexão</h3>
                <p><strong>Erro:</strong> ${data.error}</p>
                ${data.details ? `<pre>${formatJSON(data.details)}</pre>` : ''}
            `;
        }
    } catch (error) {
        resultBox.className = 'result-box error';
        resultBox.innerHTML = `
            <h3>❌ Erro</h3>
            <p>${error.message}</p>
        `;
    } finally {
        hideLoading();
        resultBox.style.display = 'block';
    }
}

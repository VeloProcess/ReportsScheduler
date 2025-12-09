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

// Configura agendamento personalizado
async function setCustomSchedule() {
    const timeInput = document.getElementById('custom-schedule-time');
    const frequencySelect = document.getElementById('custom-schedule-frequency');
    const statusDiv = document.getElementById('custom-schedule-status');
    
    const time = timeInput.value;
    const frequency = frequencySelect.value;
    
    if (!time) {
        statusDiv.className = 'custom-schedule-status error';
        statusDiv.textContent = '❌ Por favor, selecione um horário.';
        statusDiv.style.display = 'block';
        return;
    }
    
    // Verifica se o horário já passou (se for execução única)
    if (frequency === 'once') {
        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        const selectedTime = new Date();
        selectedTime.setHours(hours, minutes, 0, 0);
        
        if (selectedTime <= now) {
            statusDiv.className = 'custom-schedule-status error';
            statusDiv.textContent = '❌ O horário selecionado já passou. Escolha um horário futuro.';
            statusDiv.style.display = 'block';
            return;
        }
    }
    
    try {
        showLoading();
        
        // Para o scheduler atual se estiver rodando
        const stopResponse = await fetch('/api/scheduler/stop', { method: 'POST' });
        await stopResponse.json();
        
        // Inicia com o novo agendamento
        const response = await fetch('/api/scheduler/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customTime: time,
                frequency: frequency
            })
        });
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Resposta não é JSON:', text.substring(0, 500));
            hideLoading();
            statusDiv.className = 'custom-schedule-status error';
            statusDiv.textContent = '❌ Erro: Servidor retornou resposta inválida.';
            statusDiv.style.display = 'block';
            return;
        }
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            const frequencyText = frequency === 'daily' ? 'diariamente' : 'uma vez hoje';
            const nextExec = result.nextExecution ? new Date(result.nextExecution).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'em breve';
            
            statusDiv.className = 'custom-schedule-status success';
            statusDiv.innerHTML = `
                ✅ Agendamento configurado com sucesso!<br>
                <strong>Horário:</strong> ${time}<br>
                <strong>Frequência:</strong> ${frequencyText}<br>
                <strong>Próxima execução:</strong> ${nextExec}
            `;
            statusDiv.style.display = 'block';
            
            await loadSchedulerStatus();
            
            // Limpa a mensagem após 5 segundos
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        } else {
            statusDiv.className = 'custom-schedule-status error';
            statusDiv.textContent = `❌ Erro: ${result.message || result.error}`;
            statusDiv.style.display = 'block';
        }
    } catch (error) {
        hideLoading();
        console.error('Erro completo:', error);
        statusDiv.className = 'custom-schedule-status error';
        statusDiv.textContent = `❌ Erro ao configurar agendamento: ${error.message}`;
        statusDiv.style.display = 'block';
    }
}

// Inicia o scheduler (padrão: meia-noite)
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

// --- 🖥️ CONSOLE DE EXECUÇÃO ---

let consolePollingInterval = null;
let lastLogTimestamp = null;

// Adiciona mensagem ao console
function addConsoleMessage(type, message, progress = null) {
    const container = document.getElementById('console-container');
    if (!container) return;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    
    let progressHTML = '';
    if (progress !== null) {
        progressHTML = `
            <div class="console-progress-bar">
                <div class="console-progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="console-progress-text">${progress}% concluído</div>
        `;
    }
    
    line.innerHTML = `
        <span class="console-time">[${timeStr}]</span>
        <span class="console-status">${message}</span>
        ${progressHTML}
    `;
    
    container.appendChild(line);
    
    // Auto-scroll para o final
    container.scrollTop = container.scrollHeight;
    
    // Limita a 200 linhas para não sobrecarregar
    while (container.children.length > 200) {
        container.removeChild(container.firstChild);
    }
}

// Limpa o console
function clearConsole() {
    const container = document.getElementById('console-container');
    if (container) {
        container.innerHTML = `
            <div class="console-line info">
                <span class="console-time">[--:--:--]</span>
                <span class="console-status">Console limpo. Aguardando execuções...</span>
            </div>
        `;
    }
    lastLogTimestamp = null;
}

// Inicia polling de logs durante execução
function startConsolePolling() {
    if (consolePollingInterval) return;
    
    addConsoleMessage('info', '🔍 Monitorando execução em tempo real...');
    
    consolePollingInterval = setInterval(async () => {
        try {
            const params = new URLSearchParams();
            params.append('level', 'ETL');
            params.append('limit', '20');
            if (lastLogTimestamp) {
                params.append('since', lastLogTimestamp);
            }
            
            const response = await fetch(`/api/logs?${params.toString()}`);
            if (!response.ok) return;
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return;
            }
            
            const data = await response.json();
            
            if (data.success && data.logs && data.logs.length > 0) {
                data.logs.forEach(log => {
                    let type = 'info';
                    let message = log.message;
                    
                    if (log.level === 'ERROR') {
                        type = 'error';
                    } else if (log.level === 'WARN') {
                        type = 'warning';
                    } else if (log.level === 'ETL') {
                        type = 'info';
                        // Detecta padrões de progresso
                        if (message.includes('Processando chamadas')) {
                            addConsoleMessage('info', '📞 Iniciando processamento de chamadas...');
                        } else if (message.includes('Processando pausas')) {
                            addConsoleMessage('info', '⏸ Iniciando processamento de pausas...');
                        } else if (message.includes('processadas:')) {
                            const match = message.match(/(\d+)/);
                            if (match) {
                                addConsoleMessage('success', `✅ ${message}`);
                            }
                        } else if (message.includes('concluída')) {
                            addConsoleMessage('success', `✅ ${message}`);
                        } else if (message.includes('INICIANDO')) {
                            addConsoleMessage('info', '🚀 Execução iniciada');
                        } else {
                            addConsoleMessage('info', message);
                        }
                    }
                    
                    if (log.timestamp) {
                        lastLogTimestamp = log.timestamp;
                    }
                });
            }
            
            // Verifica se a execução terminou
            const statusResponse = await fetch('/api/scheduler/status');
            if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                if (!statusData.isRunning && consolePollingInterval) {
                    stopConsolePolling();
                    addConsoleMessage('success', '✅ Execução finalizada');
                    setTimeout(() => {
                        loadSchedulerStatus();
                        loadStats();
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('Erro ao buscar logs:', error);
        }
    }, 2000); // Poll a cada 2 segundos
}

// Para o polling de logs
function stopConsolePolling() {
    if (consolePollingInterval) {
        clearInterval(consolePollingInterval);
        consolePollingInterval = null;
    }
}

// Executa ETL manualmente
async function runManualETL() {
    if (!confirm('⚠️ ATENÇÃO: Deseja executar o ETL agora?\n\n📅 Os dados processados serão APENAS do dia anterior (D-1).\n\nDeseja continuar?')) {
        return;
    }
    
    try {
        // Limpa console e inicia monitoramento
        clearConsole();
        addConsoleMessage('info', '🚀 Iniciando execução manual do ETL...');
        startConsolePolling();
        
        const response = await fetch('/api/scheduler/run', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            addConsoleMessage('success', '✅ Execução iniciada com sucesso');
            // O polling vai continuar monitorando
        } else {
            stopConsolePolling();
            addConsoleMessage('error', `❌ Erro ao iniciar execução: ${result.message || result.error}`);
        }
    } catch (error) {
        stopConsolePolling();
        addConsoleMessage('error', `❌ Erro ao executar manualmente: ${error.message}`);
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

// --- 📋 LOGS DO SERVIDOR ---

let serverLogsAutoRefresh = true;
let serverLogsInterval = null;
let lastServerLogTimestamp = null;

// Carrega logs do servidor
async function loadServerLogs() {
    try {
        const level = document.getElementById('server-log-level')?.value || '';
        const params = new URLSearchParams();
        params.append('limit', '100');
        if (level) {
            params.append('level', level);
        }
        if (lastServerLogTimestamp) {
            params.append('since', lastServerLogTimestamp);
        }
        
        const response = await fetch(`/api/logs?${params.toString()}`);
        if (!response.ok) return;
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.logs && data.logs.length > 0) {
            const container = document.getElementById('server-logs-container');
            if (!container) return;
            
            // Se não há timestamp anterior, limpa o container
            if (!lastServerLogTimestamp) {
                container.innerHTML = '';
            }
            
            data.logs.forEach(log => {
                const logLine = createServerLogLine(log);
                container.appendChild(logLine);
                
                if (log.timestamp) {
                    const logDate = new Date(log.timestamp);
                    if (!lastServerLogTimestamp || logDate > new Date(lastServerLogTimestamp)) {
                        lastServerLogTimestamp = log.timestamp;
                    }
                }
            });
            
            // Auto-scroll para o final
            container.scrollTop = container.scrollHeight;
            
            // Limita a 500 linhas
            while (container.children.length > 500) {
                container.removeChild(container.firstChild);
            }
        } else if (!lastServerLogTimestamp) {
            // Se não há logs e é a primeira carga, mostra mensagem
            const container = document.getElementById('server-logs-container');
            if (container) {
                container.innerHTML = `
                    <div class="console-line info">
                        <span class="console-time">[--:--:--]</span>
                        <span class="console-status">Nenhum log encontrado ainda. Os logs aparecerão aqui quando o servidor gerar mensagens.</span>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar logs do servidor:', error);
    }
}

// Cria uma linha de log do servidor
function createServerLogLine(log) {
    const line = document.createElement('div');
    line.className = `console-line ${log.level || 'INFO'}`;
    
    const timestamp = log.timestamp ? new Date(log.timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }) : '--:--:--';
    
    const level = log.level || 'INFO';
    const message = log.message || '';
    
    line.innerHTML = `
        <span class="console-time">[${timestamp}]</span>
        <span class="log-level-badge ${level}">${level}</span>
        <span class="console-status">${escapeHtml(message)}</span>
    `;
    
    return line;
}

// Escapa HTML para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Limpa logs do servidor
function clearServerLogs() {
    const container = document.getElementById('server-logs-container');
    if (container) {
        container.innerHTML = `
            <div class="console-line info">
                <span class="console-time">[--:--:--]</span>
                <span class="console-status">Logs limpos. Aguardando novas mensagens...</span>
            </div>
        `;
    }
    lastServerLogTimestamp = null;
}

// Toggle auto-refresh dos logs
function toggleServerLogsAutoRefresh() {
    serverLogsAutoRefresh = !serverLogsAutoRefresh;
    const toggleBtn = document.getElementById('toggle-auto-refresh');
    const textSpan = document.getElementById('auto-refresh-text');
    
    if (serverLogsAutoRefresh) {
        textSpan.textContent = 'Auto-atualizar: ON';
        toggleBtn.classList.add('btn-success');
        toggleBtn.classList.remove('btn-warning');
        startServerLogsPolling();
    } else {
        textSpan.textContent = 'Auto-atualizar: OFF';
        toggleBtn.classList.add('btn-warning');
        toggleBtn.classList.remove('btn-success');
        stopServerLogsPolling();
    }
}

// Inicia polling de logs do servidor
function startServerLogsPolling() {
    if (serverLogsInterval) return;
    
    // Carrega logs imediatamente
    loadServerLogs();
    
    // Depois atualiza a cada 2 segundos
    serverLogsInterval = setInterval(() => {
        if (serverLogsAutoRefresh) {
            loadServerLogs();
        }
    }, 2000);
}

// Para o polling de logs
function stopServerLogsPolling() {
    if (serverLogsInterval) {
        clearInterval(serverLogsInterval);
        serverLogsInterval = null;
    }
}

// Carrega estatísticas e status do scheduler ao iniciar
loadStats();
loadSchedulerStatus();
startServerLogsPolling(); // Inicia o polling de logs automaticamente

// Recarrega a cada 30 segundos
setInterval(() => {
    loadStats();
    loadSchedulerStatus();
}, 30 * 1000);

// --- 📜 HISTÓRICO E LOGS ---

// Funções antigas de tabs removidas - agora usando modal

// --- 📱 CONTROLE DO SIDEBAR E MODAL ---

// Alterna sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
}

// Mostra histórico de erros
function showErrorHistory() {
    const modal = document.getElementById('error-history-modal');
    modal.style.display = 'flex';
    toggleSidebar(); // Fecha o sidebar
    
    // Carrega dados
    showErrorTab('errors');
}

// Fecha histórico de erros
function closeErrorHistory() {
    const modal = document.getElementById('error-history-modal');
    modal.style.display = 'none';
}

// Alterna tabs no modal de erros
function showErrorTab(tabName, clickedButton = null) {
    // Esconde todas as tabs
    document.querySelectorAll('#error-history-modal .tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('#error-history-modal .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostra a tab selecionada
    const tabElement = document.getElementById(`${tabName}-tab`);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    // Ativa o botão que foi clicado ou encontra o correto
    if (clickedButton) {
        clickedButton.classList.add('active');
    } else {
        // Se não tiver botão clicado, ativa o botão correspondente
        const buttons = document.querySelectorAll('#error-history-modal .tab-btn');
        buttons.forEach(btn => {
            if (btn.textContent.includes(tabName === 'errors' ? 'Apenas Erros' : 
                                         tabName === 'all' ? 'Todas as Execuções' : 'Logs de Erro')) {
                btn.classList.add('active');
            }
        });
    }
    
    // Carrega dados da tab
    if (tabName === 'errors') {
        loadErrorHistory();
    } else if (tabName === 'all') {
        loadAllHistory();
    } else if (tabName === 'logs') {
        loadErrorLogs();
    }
}

// Carrega apenas execuções com erro
async function loadErrorHistory() {
    const errorList = document.getElementById('error-history-list');
    if (!errorList) return;
    
    errorList.innerHTML = '<p class="loading-text">Carregando histórico de erros...</p>';
    
    try {
        const response = await fetch('/api/history?limit=100');
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Resposta não é JSON:', text.substring(0, 500));
            throw new Error(`Servidor retornou ${contentType} em vez de JSON`);
        }
        
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.stats) {
            // Atualiza estatísticas no modal
            document.getElementById('total-executions-modal').textContent = data.stats.total || 0;
            document.getElementById('success-rate-modal').textContent = 
                data.stats.successRate ? `${data.stats.successRate.toFixed(1)}%` : '-';
            document.getElementById('avg-duration-modal').textContent = 
                data.stats.avgDuration ? `${(data.stats.avgDuration / 1000).toFixed(1)}s` : '-';
        }
        
        // Filtra apenas erros
        const errors = data.history ? data.history.filter(exec => !exec.success) : [];
        
        if (errors.length > 0) {
            errorList.innerHTML = errors.map(exec => {
                const startTime = new Date(exec.startTime);
                const duration = exec.duration ? `${(exec.duration / 1000).toFixed(1)}s` : '-';
                
                return `
                    <div class="history-item error">
                        <div class="history-item-info">
                            <div class="history-item-time">
                                ${startTime.toLocaleString('pt-BR', { 
                                    dateStyle: 'short', 
                                    timeStyle: 'short' 
                                })}
                            </div>
                            <div class="history-item-details">
                                ❌ Erro
                                ${exec.periodProcessed ? ` | Período: ${exec.periodProcessed}` : ''}
                                ${exec.errors && exec.errors.length > 0 ? 
                                    `<br><strong>Erros:</strong> ${exec.errors.join(', ')}` : ''}
                                ${exec.error ? `<br><strong>Erro:</strong> ${exec.error}` : ''}
                            </div>
                        </div>
                        <div class="history-item-stats">
                            <div>📞 ${exec.chamadasCount || 0}</div>
                            <div>⏸ ${exec.pausasCount || 0}</div>
                            <div style="margin-top: 4px; font-size: 0.75rem; opacity: 0.7;">
                                ${duration}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            errorList.innerHTML = '<p class="loading-text">Nenhum erro encontrado no histórico</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar histórico de erros:', error);
        errorList.innerHTML = `<p class="loading-text" style="color: var(--cor-erro);">Erro ao carregar histórico: ${error.message}</p>`;
    }
}

// Carrega todas as execuções
async function loadAllHistory() {
    const allList = document.getElementById('all-history-list');
    if (!allList) return;
    
    allList.innerHTML = '<p class="loading-text">Carregando histórico completo...</p>';
    
    try {
        const response = await fetch('/api/history?limit=100');
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Servidor retornou ${contentType} em vez de JSON`);
        }
        
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.history && data.history.length > 0) {
            allList.innerHTML = data.history.map(exec => {
                const startTime = new Date(exec.startTime);
                const duration = exec.duration ? `${(exec.duration / 1000).toFixed(1)}s` : '-';
                const statusClass = exec.success ? 'success' : 'error';
                const statusIcon = exec.success ? '✅' : '❌';
                
                return `
                    <div class="history-item ${statusClass}">
                        <div class="history-item-info">
                            <div class="history-item-time">
                                ${startTime.toLocaleString('pt-BR', { 
                                    dateStyle: 'short', 
                                    timeStyle: 'short' 
                                })}
                            </div>
                            <div class="history-item-details">
                                ${statusIcon} ${exec.success ? 'Sucesso' : 'Erro'}
                                ${exec.periodProcessed ? ` | Período: ${exec.periodProcessed}` : ''}
                                ${exec.errors && exec.errors.length > 0 ? 
                                    ` | Erros: ${exec.errors.join(', ')}` : ''}
                            </div>
                        </div>
                        <div class="history-item-stats">
                            <div>📞 ${exec.chamadasCount || 0}</div>
                            <div>⏸ ${exec.pausasCount || 0}</div>
                            <div style="margin-top: 4px; font-size: 0.75rem; opacity: 0.7;">
                                ${duration}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            allList.innerHTML = '<p class="loading-text">Nenhuma execução encontrada</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar histórico completo:', error);
        allList.innerHTML = `<p class="loading-text" style="color: var(--cor-erro);">Erro ao carregar histórico: ${error.message}</p>`;
    }
}

// Carrega apenas logs de erro
async function loadErrorLogs() {
    const errorLogsList = document.getElementById('error-logs-list');
    if (!errorLogsList) return;
    
    errorLogsList.innerHTML = '<p class="loading-text">Carregando logs de erro...</p>';
    
    try {
        const limit = document.getElementById('error-log-limit')?.value || 100;
        
        const params = new URLSearchParams();
        params.append('level', 'ERROR');
        params.append('limit', limit);
        
        const response = await fetch(`/api/logs?${params.toString()}`);
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Servidor retornou ${contentType} em vez de JSON`);
        }
        
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.logs && data.logs.length > 0) {
            errorLogsList.innerHTML = data.logs.map(log => {
                const timestamp = new Date(log.timestamp);
                const timeStr = timestamp.toLocaleString('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'medium'
                });
                
                return `
                    <div class="log-entry ERROR">
                        <span class="log-timestamp">[${timeStr}]</span>
                        <span class="log-level">[${log.level}]</span>
                        <span class="log-message">${log.message}</span>
                        ${log.data ? `<pre style="margin-top: 8px; font-size: 0.75rem; opacity: 0.8;">${JSON.stringify(log.data, null, 2)}</pre>` : ''}
                    </div>
                `;
            }).join('');
        } else {
            errorLogsList.innerHTML = '<p class="loading-text">Nenhum log de erro encontrado</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar logs de erro:', error);
        errorLogsList.innerHTML = `<p class="loading-text" style="color: var(--cor-erro);">Erro ao carregar logs: ${error.message}</p>`;
    }
}

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
async function testSheets(event) {
    const sheetType = document.getElementById('sheet-type').value;
    const resultBox = document.getElementById('sheets-result');
    
    // Previne múltiplos cliques
    const btn = event?.target || document.querySelector('button[onclick*="testSheets"]');
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
    }
    
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
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Servidor retornou ${contentType} em vez de JSON. Status: ${response.status}`);
        }
        
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
            let errorHTML = `
                <h3>❌ Falha na Conexão</h3>
                <p><strong>Erro:</strong> ${data.error || 'Erro desconhecido'}</p>
            `;
            
            if (data.message) {
                errorHTML += `<p style="margin-top: 12px; color: #f59e0b;"><strong>ℹ️ Informação:</strong> ${data.message}</p>`;
            }
            
            if (data.missing) {
                errorHTML += `<div style="margin-top: 12px; padding: 12px; background: rgba(244, 67, 54, 0.1); border-radius: 8px;">`;
                errorHTML += `<p style="font-weight: 600; margin-bottom: 8px;">Credenciais faltando:</p>`;
                if (data.missing.email) {
                    errorHTML += `<p>❌ GOOGLE_SERVICE_ACCOUNT_EMAIL não configurado</p>`;
                }
                if (data.missing.key) {
                    errorHTML += `<p>❌ GOOGLE_PRIVATE_KEY não configurado</p>`;
                }
                errorHTML += `</div>`;
            }
            
            if (data.details) {
                errorHTML += `<details style="margin-top: 12px;">
                    <summary style="cursor: pointer; font-weight: 600;">Detalhes técnicos</summary>
                    <pre style="margin-top: 8px;">${formatJSON(data.details)}</pre>
                </details>`;
            }
            
            resultBox.innerHTML = errorHTML;
        }
    } catch (error) {
        resultBox.className = 'result-box error';
        resultBox.innerHTML = `
            <h3>❌ Erro</h3>
            <p><strong>Erro:</strong> ${error.message}</p>
            <p style="margin-top: 12px; color: #f59e0b;">
                <strong>ℹ️ Dica:</strong> Verifique se o servidor está rodando e se as credenciais estão configuradas no arquivo .env
            </p>
        `;
    } finally {
        hideLoading();
        resultBox.style.display = 'block';
        
        // Reabilita o botão após um pequeno delay
        if (btn) {
            setTimeout(() => {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            }, 500);
        }
    }
}

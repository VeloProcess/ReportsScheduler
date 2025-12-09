import { getSchedulerStatus } from './scheduler/scheduler.js';
import { getHistory } from './utils/history.js';

console.log('🔍 Verificando status do scheduler e histórico...\n');

// Verifica status do scheduler
const status = getSchedulerStatus();
console.log('📊 Status do Scheduler:');
console.log(`   Ativo: ${status.isActive ? '✅ Sim' : '❌ Não'}`);
console.log(`   Executando agora: ${status.isRunning ? '✅ Sim' : '❌ Não'}`);
console.log(`   Agendamento: ${status.schedule || 'Nenhum'}`);
if (status.nextExecution) {
  console.log(`   Próxima execução: ${status.nextExecution.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
}
if (status.lastExecution) {
  console.log(`   Última execução: ${new Date(status.lastExecution.startTime).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  console.log(`   Status: ${status.lastExecution.success ? '✅ Sucesso' : '❌ Erro'}`);
}

console.log('\n📋 Histórico de Execuções:');
const history = getHistory(10);
if (history.length === 0) {
  console.log('   ⚠️ Nenhuma execução encontrada no histórico');
  console.log('   💡 Isso pode significar que:');
  console.log('      - O scheduler nunca foi executado');
  console.log('      - O servidor não estava rodando às 00:00');
  console.log('      - O histórico ainda não foi criado');
} else {
  console.log(`   Total de execuções: ${history.length}`);
  history.forEach((exec, index) => {
    const date = new Date(exec.startTime);
    console.log(`   ${index + 1}. ${date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${exec.success ? '✅' : '❌'} ${exec.success ? 'Sucesso' : 'Erro'}`);
  });
}

console.log('\n💡 Para garantir execução às 00:00:');
console.log('   1. O servidor precisa estar rodando continuamente');
console.log('   2. Execute: node server.js (e deixe rodando)');
console.log('   3. O scheduler iniciará automaticamente');
console.log('   4. Executará às 00:00 todos os dias');


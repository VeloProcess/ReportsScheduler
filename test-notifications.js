import dotenv from 'dotenv';
import { notifyETLExecution, notifyCriticalError, sendEmail, sendWebhook } from './utils/notifications.js';

dotenv.config();

console.log('🧪 Testando Sistema de Notificações\n');

// Teste 1: Execução com sucesso
console.log('📧 Teste 1: Notificação de execução com sucesso...');
const successExecution = {
  startTime: new Date(Date.now() - 30000), // 30 segundos atrás
  endTime: new Date(),
  duration: 30000,
  success: true,
  chamadasCount: 150,
  pausasCount: 45,
  periodProcessed: '2025-01-14 até 2025-01-15'
};

try {
  await notifyETLExecution(successExecution);
  console.log('✅ Teste 1 concluído\n');
} catch (error) {
  console.error('❌ Erro no teste 1:', error.message);
}

// Aguarda 2 segundos
await new Promise(resolve => setTimeout(resolve, 2000));

// Teste 2: Execução com erro
console.log('📧 Teste 2: Notificação de execução com erro...');
const errorExecution = {
  startTime: new Date(Date.now() - 45000),
  endTime: new Date(),
  duration: 45000,
  success: false,
  chamadasCount: 0,
  pausasCount: 0,
  errors: ['Erro ao conectar com API 55PBX', 'Timeout na requisição'],
  periodProcessed: '2025-01-14 até 2025-01-15'
};

try {
  await notifyETLExecution(errorExecution);
  console.log('✅ Teste 2 concluído\n');
} catch (error) {
  console.error('❌ Erro no teste 2:', error.message);
}

// Aguarda 2 segundos
await new Promise(resolve => setTimeout(resolve, 2000));

// Teste 3: Erro crítico
console.log('📧 Teste 3: Notificação de erro crítico...');
const criticalError = new Error('Falha crítica na execução do ETL');
criticalError.stack = 'Error: Falha crítica na execução do ETL\n    at test-notifications.js:45\n    at async main';

try {
  await notifyCriticalError(criticalError, {
    startTime: new Date().toISOString(),
    periodProcessed: '2025-01-14 até 2025-01-15'
  });
  console.log('✅ Teste 3 concluído\n');
} catch (error) {
  console.error('❌ Erro no teste 3:', error.message);
}

console.log('\n✅ Todos os testes concluídos!');
console.log('\n📝 Verifique:');
console.log('   - Seu email (se EMAIL_ENABLED=true)');
console.log('   - Seu webhook (se WEBHOOK_ENABLED=true)');
console.log('   - Os logs em logs/etl-*.log');


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');

// Configurações de email para adicionar/atualizar
const emailConfig = {
  'NOTIFICATIONS_ENABLED': 'true',
  'EMAIL_ENABLED': 'true',
  'EMAIL_TO': 'gabriel.araujo@velotax.com.br',
  'EMAIL_ON_SUCCESS': 'false' // Só envia email em caso de erro (padrão)
};

console.log('📧 Configurando email no .env...\n');

try {
  let envContent = '';
  
  // Lê o arquivo .env se existir
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Arquivo .env encontrado\n');
  } else {
    console.log('⚠️ Arquivo .env não encontrado, criando novo...\n');
  }
  
  // Processa cada linha do .env
  const lines = envContent.split('\n');
  const updatedLines = [];
  const existingKeys = new Set();
  
  // Processa linhas existentes
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Ignora linhas vazias e comentários
    if (!trimmed || trimmed.startsWith('#')) {
      updatedLines.push(line);
      continue;
    }
    
    // Extrai chave e valor
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      existingKeys.add(key);
      
      // Se a chave está nas novas configurações, atualiza
      if (emailConfig[key] !== undefined) {
        updatedLines.push(`${key}=${emailConfig[key]}`);
        console.log(`✅ Atualizado: ${key}=${emailConfig[key]}`);
        delete emailConfig[key]; // Remove para não adicionar novamente
      } else {
        updatedLines.push(line); // Mantém linha original
      }
    } else {
      updatedLines.push(line); // Mantém linha original se não for formato chave=valor
    }
  }
  
  // Adiciona novas configurações que não existiam
  for (const [key, value] of Object.entries(emailConfig)) {
    updatedLines.push(`${key}=${value}`);
    console.log(`✅ Adicionado: ${key}=${value}`);
  }
  
  // Escreve o arquivo atualizado
  fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf8');
  
  console.log('\n✅ Configuração concluída!');
  console.log('\n📝 Próximos passos:');
  console.log('   1. Configure EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS');
  console.log('   2. Para Gmail, use senha de aplicativo: https://myaccount.google.com/apppasswords');
  console.log('   3. Execute: node test-notifications.js');
  console.log('\n💡 Exemplo de configuração completa:');
  console.log('   EMAIL_HOST=smtp.gmail.com');
  console.log('   EMAIL_PORT=587');
  console.log('   EMAIL_SECURE=false');
  console.log('   EMAIL_USER=seu-email@gmail.com');
  console.log('   EMAIL_PASS=sua-senha-de-app');
  console.log('   EMAIL_FROM=seu-email@gmail.com');
  
} catch (error) {
  console.error('❌ Erro ao configurar:', error.message);
  process.exit(1);
}


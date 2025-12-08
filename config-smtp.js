import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');

// Configurações SMTP - Gmail
const smtpConfig = {
  'EMAIL_HOST': 'smtp.gmail.com',
  'EMAIL_PORT': '587',
  'EMAIL_SECURE': 'false',
  'EMAIL_USER': 'reports@velotax.com.br', // Será atualizado se necessário
  'EMAIL_PASS': 'hcjf nddh pqmh kqih',
  'EMAIL_FROM': 'Reports <reports@velotax.com.br>'
};

console.log('📧 Configurando servidor SMTP...\n');

try {
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  const lines = envContent.split('\n');
  const updatedLines = [];
  const existingKeys = new Set();
  
  // Processa linhas existentes
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed || trimmed.startsWith('#')) {
      updatedLines.push(line);
      continue;
    }
    
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      existingKeys.add(key);
      
      // Atualiza se a chave está nas novas configurações
      if (smtpConfig[key] !== undefined) {
        updatedLines.push(`${key}=${smtpConfig[key]}`);
        console.log(`✅ ${key}=${smtpConfig[key]}`);
        delete smtpConfig[key];
      } else {
        updatedLines.push(line);
      }
    } else {
      updatedLines.push(line);
    }
  }
  
  // Adiciona novas configurações
  for (const [key, value] of Object.entries(smtpConfig)) {
    updatedLines.push(`${key}=${value}`);
    console.log(`✅ Adicionado: ${key}=${value}`);
  }
  
  fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf8');
  
  console.log('\n✅ Configuração SMTP concluída!');
  console.log('\n📧 Resumo da configuração:');
  console.log(`   Servidor: ${smtpConfig.EMAIL_HOST || 'smtp.gmail.com'}`);
  console.log(`   Porta: ${smtpConfig.EMAIL_PORT || '587'}`);
  console.log(`   Usuário: ${smtpConfig.EMAIL_USER || 'reports@velotax.com.br'}`);
  console.log(`   Destinatário: gabriel.araujo@velotax.com.br`);
  console.log('\n🧪 Para testar, execute:');
  console.log('   node test-notifications.js');
  
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}


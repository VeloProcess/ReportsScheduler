import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');

// Senha sem espaços
const emailPass = 'imyzjvnrjskzbwvx';

console.log('📧 Configurando email final...\n');
console.log('⚠️ IMPORTANTE: Preciso saber qual é o seu EMAIL COMPLETO');
console.log('   Exemplo: seuemail@gmail.com\n');

// Pede o email via argumento da linha de comando
const emailUser = process.argv[2];

if (!emailUser) {
  console.log('❌ Por favor, forneça o email completo como argumento:');
  console.log('   node config-email-final.js seuemail@gmail.com\n');
  process.exit(1);
}

console.log(`✅ Email fornecido: ${emailUser}\n`);

const smtpConfig = {
  'EMAIL_HOST': 'smtp.gmail.com',
  'EMAIL_PORT': '587',
  'EMAIL_SECURE': 'false',
  'EMAIL_USER': emailUser,
  'EMAIL_PASS': emailPass,
  'EMAIL_FROM': `ETL 55PBX <${emailUser}>`
};

try {
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  const lines = envContent.split('\n');
  const updatedLines = [];
  const existingKeys = new Set();
  
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
  
  for (const [key, value] of Object.entries(smtpConfig)) {
    updatedLines.push(`${key}=${value}`);
    console.log(`✅ Adicionado: ${key}=${value}`);
  }
  
  fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf8');
  
  console.log('\n✅ Configuração concluída!');
  console.log('\n📧 Resumo:');
  console.log(`   Remetente: ${emailUser}`);
  console.log(`   Destinatário: gabriel.araujo@velotax.com.br`);
  console.log(`   Envio: Sempre (sucesso e erro)`);
  console.log('\n🧪 Testando agora...\n');
  
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}


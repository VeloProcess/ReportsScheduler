import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');

// Senha sem espaços
const emailPass = 'hcjfnddhpqmhkqih';

console.log('🔧 Corrigindo senha (removendo espaços)...\n');

try {
  let envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  const updatedLines = [];
  
  for (const line of lines) {
    if (line.trim().startsWith('EMAIL_PASS=')) {
      updatedLines.push(`EMAIL_PASS=${emailPass}`);
      console.log(`✅ Senha atualizada (sem espaços)`);
    } else {
      updatedLines.push(line);
    }
  }
  
  fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf8');
  
  console.log('\n✅ Correção aplicada!');
  console.log('\n⚠️ IMPORTANTE:');
  console.log('   Verifique se o EMAIL_USER está correto.');
  console.log('   Se for Gmail pessoal, use o email completo (ex: seuemail@gmail.com)');
  console.log('   A senha de aplicativo deve ser gerada para o email correto.');
  console.log('\n📧 Email configurado atualmente:');
  
  // Mostra o EMAIL_USER atual
  for (const line of lines) {
    if (line.trim().startsWith('EMAIL_USER=')) {
      console.log(`   ${line.trim()}`);
      break;
    }
  }
  
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}


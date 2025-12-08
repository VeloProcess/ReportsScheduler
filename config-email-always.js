import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');

console.log('📧 Configurando para enviar email sempre (sucesso e falha)...\n');

try {
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  const lines = envContent.split('\n');
  const updatedLines = [];
  let found = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Atualiza EMAIL_ON_SUCCESS
    if (trimmed.startsWith('EMAIL_ON_SUCCESS=')) {
      updatedLines.push('EMAIL_ON_SUCCESS=true');
      found = true;
      console.log('✅ Atualizado: EMAIL_ON_SUCCESS=true');
    } else {
      updatedLines.push(line);
    }
  }
  
  // Se não encontrou, adiciona
  if (!found) {
    updatedLines.push('EMAIL_ON_SUCCESS=true');
    console.log('✅ Adicionado: EMAIL_ON_SUCCESS=true');
  }
  
  fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf8');
  
  console.log('\n✅ Configuração atualizada!');
  console.log('📧 Agora os emails serão enviados sempre:');
  console.log('   ✅ Em caso de sucesso');
  console.log('   ❌ Em caso de erro');
  
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}


import dotenv from 'dotenv';

dotenv.config();

console.log('\n=== VERIFICAÇÃO DE CONFIGURAÇÃO GOOGLE ===\n');

const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const key = process.env.GOOGLE_PRIVATE_KEY;

console.log('1. GOOGLE_SERVICE_ACCOUNT_EMAIL:');
if (email) {
  console.log(`   ✅ Configurado: ${email}`);
} else {
  console.log('   ❌ NÃO CONFIGURADO');
}

console.log('\n2. GOOGLE_PRIVATE_KEY:');
if (key) {
  console.log(`   ✅ Configurado (${key.length} caracteres)`);
  console.log(`   Início: ${key.substring(0, 50)}...`);
  console.log(`   Fim: ...${key.substring(key.length - 50)}`);
  
  // Verifica se a chave está no formato correto
  if (key.includes('BEGIN PRIVATE KEY') && key.includes('END PRIVATE KEY')) {
    console.log('   ✅ Formato parece correto');
  } else {
    console.log('   ⚠️ Formato pode estar incorreto (não encontrou BEGIN/END PRIVATE KEY)');
  }
} else {
  console.log('   ❌ NÃO CONFIGURADO');
}

console.log('\n3. PRÓXIMOS PASSOS:');
console.log('   Para resolver o erro "invalid_grant: account not found":');
console.log('');
console.log('   a) Verifique se o email está correto no Google Cloud Console:');
console.log('      https://console.cloud.google.com/iam-admin/serviceaccounts');
console.log('');
console.log('   b) Compartilhe as planilhas com o email da Service Account:');
console.log(`      Email: ${email || '(não configurado)'}`);
console.log('      Permissão: Editor');
console.log('');
console.log('   c) Links das planilhas:');
console.log('      Chamadas: https://docs.google.com/spreadsheets/d/1E0g74VvzL37imBG5_elMixGUllLNNnudIUl2-Nd9xyw');
console.log('      Pausas: https://docs.google.com/spreadsheets/d/1qKxg4hfGXiizW3nkO1rryXbcjVR681PtuE-bN8ADfRY');
console.log('\n');


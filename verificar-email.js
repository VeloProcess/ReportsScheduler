import dotenv from 'dotenv';
dotenv.config();

console.log('📧 Verificando configuração de email atual:\n');

const emailUser = process.env.EMAIL_USER || 'NÃO CONFIGURADO';
const emailHost = process.env.EMAIL_HOST || 'NÃO CONFIGURADO';
const emailTo = process.env.EMAIL_TO || 'NÃO CONFIGURADO';

console.log(`EMAIL_USER: ${emailUser}`);
console.log(`EMAIL_HOST: ${emailHost}`);
console.log(`EMAIL_TO: ${emailTo}`);
console.log('\n💡 Para emails corporativos (@velotax.com.br):');
console.log('   - Se for Google Workspace, pode precisar de configuração diferente');
console.log('   - Ou pode usar OAuth2 em vez de senha de aplicativo');
console.log('\n❓ Qual é o email COMPLETO que tem a senha de aplicativo?');
console.log('   Exemplos:');
console.log('   - reports@gmail.com');
console.log('   - reports@velotax.com.br');
console.log('   - outro-email@velotax.com.br');


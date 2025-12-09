import dotenv from 'dotenv';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

dotenv.config();

const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const SHEET_CHAMADAS_ID = process.env.SHEET_CHAMADAS_ID;
const SHEET_PAUSAS_ID = process.env.SHEET_PAUSAS_ID;

async function testarPlanilha(sheetId, nome) {
  console.log(`\n=== Testando Planilha: ${nome} ===`);
  console.log(`ID: ${sheetId}`);
  
  try {
    const auth = new JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(sheetId, auth);
    await doc.loadInfo();
    
    console.log(`✅ Conectado com sucesso!`);
    console.log(`   Título: ${doc.title}`);
    console.log(`   Total de abas: ${doc.sheetCount}`);
    
    console.log(`\n   Abas disponíveis:`);
    doc.sheetsByIndex.forEach((sheet, index) => {
      console.log(`   ${index + 1}. "${sheet.title}" (${sheet.rowCount} linhas, ${sheet.columnCount} colunas)`);
    });
    
    // Tenta acessar a aba "Página1"
    const sheet = doc.sheetsByTitle['Página1'];
    if (sheet) {
      console.log(`\n   ✅ Aba "Página1" encontrada!`);
      console.log(`   Linhas: ${sheet.rowCount}`);
      console.log(`   Colunas: ${sheet.columnCount}`);
      
      // Tenta ler algumas linhas
      try {
        await sheet.loadHeaderRow();
        console.log(`   ✅ Cabeçalhos encontrados: ${sheet.headerValues.join(', ')}`);
        
        const rows = await sheet.getRows({ limit: 5 });
        console.log(`   ✅ Linhas de dados encontradas: ${rows.length}`);
        
        if (rows.length > 0) {
          console.log(`\n   Primeiras linhas:`);
          rows.forEach((row, i) => {
            console.log(`   Linha ${i + 1}:`, row._rawData.slice(0, 5).join(' | '));
          });
        } else {
          console.log(`   ⚠️ Planilha está vazia (sem dados)`);
        }
      } catch (error) {
        console.log(`   ⚠️ Erro ao ler dados: ${error.message}`);
        console.log(`   (Isso é normal se a planilha estiver vazia)`);
      }
    } else {
      console.log(`\n   ⚠️ Aba "Página1" NÃO encontrada!`);
      console.log(`   Abas disponíveis: ${Object.keys(doc.sheetsByTitle).join(', ')}`);
    }
    
    return true;
  } catch (error) {
    console.log(`\n❌ ERRO ao conectar:`);
    console.log(`   ${error.message}`);
    if (error.message.includes('invalid_grant')) {
      console.log(`\n   ⚠️ Problema de autenticação!`);
      console.log(`   Verifique se:`);
      console.log(`   1. O email ${GOOGLE_SERVICE_ACCOUNT_EMAIL} está correto`);
      console.log(`   2. A chave privada corresponde ao email`);
      console.log(`   3. A planilha está compartilhada com o email acima`);
    }
    return false;
  }
}

async function main() {
  console.log('🔍 TESTE DE CONEXÃO COM GOOGLE SHEETS\n');
  console.log(`Email da Service Account: ${GOOGLE_SERVICE_ACCOUNT_EMAIL}\n`);
  
  const chamadasOk = await testarPlanilha(SHEET_CHAMADAS_ID, 'Chamadas');
  const pausasOk = await testarPlanilha(SHEET_PAUSAS_ID, 'Pausas');
  
  console.log(`\n\n=== RESUMO ===`);
  console.log(`Chamadas: ${chamadasOk ? '✅ OK' : '❌ ERRO'}`);
  console.log(`Pausas: ${pausasOk ? '✅ OK' : '❌ ERRO'}`);
  
  if (chamadasOk && pausasOk) {
    console.log(`\n✅ Ambas as planilhas estão acessíveis!`);
    console.log(`Se os dados não aparecem, pode ser que:`);
    console.log(`1. Os dados foram salvos em uma aba diferente`);
    console.log(`2. A planilha foi limpa após salvar`);
    console.log(`3. Os dados foram salvos em planilhas diferentes`);
  }
}

main().catch(console.error);


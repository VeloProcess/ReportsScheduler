import dotenv from 'dotenv';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

dotenv.config();

const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const SHEET_CHAMADAS_ID = process.env.SHEET_CHAMADAS_ID;
const SHEET_PAUSAS_ID = process.env.SHEET_PAUSAS_ID;

async function verificarDados(sheetId, nome) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 ${nome.toUpperCase()}`);
  console.log('='.repeat(60));
  
  try {
    const auth = new JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(sheetId, auth);
    await doc.loadInfo();
    
    const sheet = doc.sheetsByTitle['Página1'];
    if (!sheet) {
      console.log(`❌ Aba "Página1" não encontrada!`);
      return;
    }
    
    await sheet.loadHeaderRow();
    const totalRows = sheet.rowCount;
    
    console.log(`\n📋 Informações:`);
    console.log(`   Planilha: ${doc.title}`);
    console.log(`   Aba: ${sheet.title}`);
    console.log(`   Total de linhas: ${totalRows}`);
    console.log(`   Total de colunas: ${sheet.columnCount}`);
    console.log(`   Cabeçalhos: ${sheet.headerValues.length} colunas`);
    
    if (totalRows > 1) {
      console.log(`\n✅ A planilha TEM DADOS! (${totalRows - 1} linhas de dados além do cabeçalho)`);
      
      // Mostra primeiras 3 linhas
      const rows = await sheet.getRows({ limit: 3, offset: 0 });
      console.log(`\n📝 Primeiras 3 linhas de dados:`);
      rows.forEach((row, i) => {
        const data = row._rawData.slice(0, 5); // Primeiras 5 colunas
        console.log(`   Linha ${i + 1}: ${data.join(' | ')}`);
      });
      
      // Mostra últimas 3 linhas
      if (totalRows > 4) {
        const lastRows = await sheet.getRows({ limit: 3, offset: totalRows - 4 });
        console.log(`\n📝 Últimas 3 linhas de dados:`);
        lastRows.forEach((row, i) => {
          const data = row._rawData.slice(0, 5); // Primeiras 5 colunas
          console.log(`   Linha ${totalRows - 2 + i}: ${data.join(' | ')}`);
        });
      }
      
      // Verifica se há dados recentes (últimas 24h)
      const rowsAll = await sheet.getRows({ limit: 100 });
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      let dadosRecentes = 0;
      rowsAll.forEach(row => {
        // Tenta encontrar coluna de data
        const dataCol = row.get('Data') || row.get('Data Inicial') || row.get('Time');
        if (dataCol) {
          try {
            const dataRow = new Date(dataCol);
            if (dataRow >= hoje) {
              dadosRecentes++;
            }
          } catch (e) {
            // Ignora erros de parsing
          }
        }
      });
      
      if (dadosRecentes > 0) {
        console.log(`\n🆕 Dados recentes (hoje): ${dadosRecentes} linhas`);
      }
    } else {
      console.log(`\n⚠️ A planilha está vazia (apenas cabeçalho)`);
    }
    
    console.log(`\n🔗 Link da planilha:`);
    console.log(`   https://docs.google.com/spreadsheets/d/${sheetId}`);
    
  } catch (error) {
    console.log(`\n❌ ERRO: ${error.message}`);
  }
}

async function main() {
  console.log('\n🔍 VERIFICAÇÃO DETALHADA DAS PLANILHAS\n');
  
  await verificarDados(SHEET_CHAMADAS_ID, 'Chamadas');
  await verificarDados(SHEET_PAUSAS_ID, 'Pausas');
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`\n💡 DICAS:`);
  console.log(`1. Verifique se está olhando as planilhas corretas:`);
  console.log(`   - Calls55DAY (Chamadas)`);
  console.log(`   - Pausas55day (Pausas)`);
  console.log(`2. Certifique-se de estar na aba "Página1"`);
  console.log(`3. Verifique se há filtros aplicados (ícone de funil na barra de ferramentas)`);
  console.log(`4. Role a planilha para baixo - os dados podem estar mais abaixo`);
  console.log(`5. Use Ctrl+F para buscar por uma data específica`);
  console.log(`\n`);
}

main().catch(console.error);


import { QuoteRepository } from './QuoteRepository.js';
import { GoogleSheetsRepository } from './GoogleSheetsRepository.js';
import { ExcelFileRepository } from './ExcelFileRepository.js';

export * from './QuoteRepository.js';
export { GoogleSheetsRepository } from './GoogleSheetsRepository.js';
export { ExcelFileRepository } from './ExcelFileRepository.js';

export function getQuoteRepository(env: NodeJS.ProcessEnv = process.env): QuoteRepository {
  const driver = env.DB_DRIVER;
  if (!driver) {
    throw new Error('DB_DRIVER no definido. Use "sheets" o "excel".');
  }

  if (driver === 'sheets') {
    const spreadsheetId = required(env, 'SHEET_ID');
    const tab = env.SHEET_TAB ?? 'quotes';
    const serviceAccountJson = required(env, 'GOOGLE_SA_JSON');
    return new GoogleSheetsRepository({ spreadsheetId, tab, serviceAccountJson });
  }

  if (driver === 'excel') {
    const filePath = required(env, 'EXCEL_PATH');
    return new ExcelFileRepository({ filePath });
  }

  throw new Error(`DB_DRIVER inválido: "${driver}". Use "sheets" o "excel".`);
}

function required(env: NodeJS.ProcessEnv, key: string): string {
  const v = env[key];
  if (!v || v.length === 0) {
    throw new Error(`Variable de entorno requerida ausente: ${key}`);
  }
  return v;
}

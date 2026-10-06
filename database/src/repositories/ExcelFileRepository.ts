import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import ExcelJS from 'exceljs';
import lockfile from 'proper-lockfile';
import {
  QUOTE_COLUMNS,
  Quote,
  QuoteNotFoundError,
  QuoteRepository,
  quoteToRow,
} from './QuoteRepository.js';

export interface ExcelFileRepositoryConfig {
  filePath: string;
  sheetName?: string;
}

const DEFAULT_SHEET = 'quotes';
// Columna M = `ultimo_contacto` (13ª columna, 1-indexed en exceljs).
const COL_ULTIMO_CONTACTO = QUOTE_COLUMNS.indexOf('ultimo_contacto') + 1;
const COL_ID = QUOTE_COLUMNS.indexOf('id') + 1;

export class ExcelFileRepository implements QuoteRepository {
  private readonly filePath: string;
  private readonly sheetName: string;

  constructor(config: ExcelFileRepositoryConfig) {
    this.filePath = config.filePath;
    this.sheetName = config.sheetName ?? DEFAULT_SHEET;
  }

  async append(quote: Quote): Promise<{ id: string }> {
    await this.ensureFile();
    const release = await lockfile.lock(this.filePath, {
      retries: { retries: 5, minTimeout: 50, maxTimeout: 500 },
    });
    try {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(this.filePath);
      const ws = wb.getWorksheet(this.sheetName) ?? wb.addWorksheet(this.sheetName);
      if (ws.rowCount === 0) {
        ws.addRow([...QUOTE_COLUMNS]);
      }
      ws.addRow(quoteToRow(quote));
      await wb.xlsx.writeFile(this.filePath);
      return { id: quote.id };
    } finally {
      await release();
    }
  }

  async ping(): Promise<boolean> {
    try {
      await fs.access(dirname(this.filePath));
      return true;
    } catch {
      return false;
    }
  }

  async touch(id: string): Promise<void> {
    await this.ensureFile();
    const release = await lockfile.lock(this.filePath, {
      retries: { retries: 5, minTimeout: 50, maxTimeout: 500 },
    });
    try {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(this.filePath);
      const ws = wb.getWorksheet(this.sheetName);
      if (!ws) throw new QuoteNotFoundError(id);

      const now = new Date().toISOString();
      let found = false;
      // Fila 1 = headers.
      for (let rowNumber = 2; rowNumber <= ws.rowCount; rowNumber++) {
        const row = ws.getRow(rowNumber);
        const cellId = row.getCell(COL_ID).value;
        if (typeof cellId === 'string' && cellId === id) {
          row.getCell(COL_ULTIMO_CONTACTO).value = now;
          row.commit();
          found = true;
          break;
        }
      }
      if (!found) throw new QuoteNotFoundError(id);

      await wb.xlsx.writeFile(this.filePath);
    } finally {
      await release();
    }
  }

  private async ensureFile(): Promise<void> {
    try {
      await fs.access(this.filePath);
      return;
    } catch {
      // crear
    }
    await fs.mkdir(dirname(this.filePath), { recursive: true });
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(this.sheetName);
    ws.addRow([...QUOTE_COLUMNS]);
    await wb.xlsx.writeFile(this.filePath);
  }
}

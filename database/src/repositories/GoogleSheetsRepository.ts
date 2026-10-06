import { google, sheets_v4 } from 'googleapis';
import { JWT } from 'google-auth-library';
import {
  Quote,
  QuoteNotFoundError,
  QuoteRepository,
  quoteToRow,
} from './QuoteRepository.js';

export interface GoogleSheetsRepositoryConfig {
  spreadsheetId: string;
  tab: string;
  serviceAccountJson: string;
  maxRetries?: number;
}

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

/**
 * Coste de operaciones (cuotas Sheets API v4: 60 req/min/usuario):
 * - append(quote): 1 llamada `values.append`.
 * - ping():         1 llamada `spreadsheets.get` (fields=spreadsheetId).
 * - touch(id):      2 llamadas → `values.get(A:A)` + `values.update(M<row>)`.
 */
export class GoogleSheetsRepository implements QuoteRepository {
  private readonly spreadsheetId: string;
  private readonly tab: string;
  private readonly maxRetries: number;
  private sheets: sheets_v4.Sheets | undefined;
  private auth: JWT | undefined;

  constructor(config: GoogleSheetsRepositoryConfig) {
    this.spreadsheetId = config.spreadsheetId;
    this.tab = config.tab;
    this.maxRetries = config.maxRetries ?? 3;

    const credentials = JSON.parse(config.serviceAccountJson) as {
      client_email: string;
      private_key: string;
    };

    this.auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: SCOPES,
    });
  }

  private client(): sheets_v4.Sheets {
    if (!this.sheets) {
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    }
    return this.sheets;
  }

  async append(quote: Quote): Promise<{ id: string }> {
    const row = quoteToRow(quote);
    const range = `${this.tab}!A:M`;

    let attempt = 0;
    let lastErr: unknown;
    while (attempt < this.maxRetries) {
      try {
        await this.client().spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: { values: [row] },
        });
        return { id: quote.id };
      } catch (err) {
        lastErr = err;
        if (!isRetryable(err) || attempt === this.maxRetries - 1) break;
        await sleep(backoffMs(attempt));
        attempt++;
      }
    }
    throw lastErr instanceof Error
      ? lastErr
      : new Error('GoogleSheetsRepository.append failed');
  }

  async ping(): Promise<boolean> {
    try {
      await this.client().spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
        fields: 'spreadsheetId',
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Marca `ultimo_contacto` (columna M) con el ISO actual UTC para la fila
   * cuyo `id` (columna A) coincida. Coste: 1 lectura A:A + 1 update M<row>.
   * Si no se encuentra el id, lanza `QuoteNotFoundError`.
   */
  async touch(id: string): Promise<void> {
    const now = new Date().toISOString();

    const idsResp = await this.client().spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${this.tab}!A:A`,
      majorDimension: 'COLUMNS',
    });

    const ids = (idsResp.data.values?.[0] ?? []) as string[];
    // La fila 1 es header → empezamos a buscar desde índice 1.
    let rowNumber = -1;
    for (let i = 1; i < ids.length; i++) {
      if (ids[i] === id) {
        rowNumber = i + 1; // Sheets es 1-indexed.
        break;
      }
    }
    if (rowNumber === -1) {
      throw new QuoteNotFoundError(id);
    }

    await this.client().spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${this.tab}!M${rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[now]] },
    });
  }
}

function isRetryable(err: unknown): boolean {
  const code = (err as { code?: number; status?: number })?.code
    ?? (err as { response?: { status?: number } })?.response?.status;
  return code === 429 || (typeof code === 'number' && code >= 500 && code < 600);
}

function backoffMs(attempt: number): number {
  const base = 200 * Math.pow(4, attempt);
  const jitter = Math.floor(Math.random() * 150);
  return base + jitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

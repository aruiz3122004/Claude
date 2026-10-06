import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { QUOTE_COLUMNS } from '../src/repositories/QuoteRepository.js';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function main(): Promise<void> {
  const spreadsheetId = requireEnv('SHEET_ID');
  const tab = process.env.SHEET_TAB ?? 'quotes';
  const serviceAccountJson = requireEnv('GOOGLE_SA_JSON');

  const credentials = JSON.parse(serviceAccountJson) as {
    client_email: string;
    private_key: string;
  };
  const auth = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: SCOPES,
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const current = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tab}!A1:M1`,
  });

  const existing = current.data.values?.[0] ?? [];
  const expected: readonly string[] = QUOTE_COLUMNS;
  const matches =
    existing.length === expected.length &&
    expected.every((h, i) => existing[i] === h);

  if (matches) {
    console.log(`[seed-headers] headers ya presentes en "${tab}!A1:M1". Nada que hacer.`);
    return;
  }

  if (existing.length > 0) {
    throw new Error(
      `[seed-headers] la fila 1 ya tiene valores distintos a los esperados. ` +
        `Revisar manualmente antes de sobreescribir. Encontrado: ${JSON.stringify(existing)}`,
    );
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tab}!A1:M1`,
    valueInputOption: 'RAW',
    requestBody: { values: [[...expected]] },
  });

  console.log(`[seed-headers] escritos ${expected.length} headers en "${tab}!A1:M1".`);
}

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Variable requerida ausente: ${key}`);
  return v;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

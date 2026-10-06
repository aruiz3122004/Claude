/**
 * Script trimestral de anonimización — CMP-04 (Ley 1581).
 *
 * Reemplaza por `***` las columnas C/D/E/K/L (nombre, telefono, email, ip_hash,
 * user_agent_hash) de las filas cuya edad efectiva (MAX(timestamp, ultimo_contacto))
 * sea > 24 meses respecto a hoy. Conserva A, B, F, G, H, I, J, M.
 *
 * Modo de uso:
 *   # Simulación (default). No escribe en el Sheet.
 *   npx tsx scripts/anonymize.ts --dry-run
 *
 *   # Aplicar cambios reales (requiere los dos flags).
 *   npx tsx scripts/anonymize.ts --dry-run --apply
 *
 * Salida: `anonymize-log-YYYY-MM-DD.csv` con una línea por fila evaluada:
 *   row_number,id,effective_date,action,reason
 *
 * - `id` nunca se incluye con PII (solo el ULID público, no identifica al titular).
 * - La columna `reason` se mantiene seca (`older-than-24m`, `recent`, `already-anon`,
 *   `invalid-date`). NUNCA se imprime nombre/telefono/email/hash en el log.
 *
 * Idempotencia: filas donde las columnas C,D,E,K,L ya son todas `***` se saltan.
 *
 * Variables requeridas: SHEET_ID, GOOGLE_SA_JSON (y opcional SHEET_TAB).
 */

import { promises as fs } from 'node:fs';
import { google, sheets_v4 } from 'googleapis';
import { JWT } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const RETENTION_MONTHS = 24;
const REDACTED = '***';
// Columnas a anonimizar (índice 0-based en la fila): C=2, D=3, E=4, K=10, L=11.
const REDACT_COLS = [2, 3, 4, 10, 11] as const;
// Columnas que marcan la edad efectiva.
const COL_TIMESTAMP = 1;        // B
const COL_ULTIMO_CONTACTO = 12; // M
const COL_ID = 0;               // A

type Row = (string | boolean | null | undefined)[];

interface LogEntry {
  row_number: number;
  id: string;
  effective_date: string;
  action: 'redact' | 'skip-recent' | 'skip-already-anon' | 'skip-invalid-date';
  reason: string;
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run');
  const apply = args.has('--apply');

  if (!dryRun && !apply) {
    console.error(
      '[anonymize] Debes pasar al menos --dry-run. Para aplicar cambios reales: --dry-run --apply.',
    );
    process.exit(2);
  }
  if (apply && !dryRun) {
    // Guardia explícita: --apply sin --dry-run no está permitido.
    console.error('[anonymize] --apply requiere también --dry-run (confirmación explícita).');
    process.exit(2);
  }

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

  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tab}!A:M`,
  });

  const values = (resp.data.values ?? []) as Row[];
  if (values.length <= 1) {
    console.log('[anonymize] hoja vacía o solo header. Nada que hacer.');
    return;
  }

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS);
  const cutoffMs = cutoff.getTime();

  const log: LogEntry[] = [];
  const updates: { range: string; row: Row }[] = [];

  // Empezamos en 1 (saltamos header).
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const rowNumber = i + 1;
    const id = asString(row[COL_ID]) ?? '';
    const ts = asString(row[COL_TIMESTAMP]) ?? '';
    const uc = asString(row[COL_ULTIMO_CONTACTO]) ?? '';

    const tsMs = parseIso(ts);
    const ucMs = parseIso(uc);
    const effectiveMs = Math.max(tsMs ?? -Infinity, ucMs ?? -Infinity);

    if (!Number.isFinite(effectiveMs)) {
      log.push({
        row_number: rowNumber,
        id,
        effective_date: '',
        action: 'skip-invalid-date',
        reason: 'ni timestamp ni ultimo_contacto son fechas válidas',
      });
      continue;
    }

    const effectiveIso = new Date(effectiveMs).toISOString();

    if (effectiveMs >= cutoffMs) {
      log.push({
        row_number: rowNumber,
        id,
        effective_date: effectiveIso,
        action: 'skip-recent',
        reason: `edad efectiva < ${RETENTION_MONTHS} meses`,
      });
      continue;
    }

    // Idempotencia: ¿todas las cols a redactar ya son '***'?
    const alreadyAnon = REDACT_COLS.every((c) => row[c] === REDACTED);
    if (alreadyAnon) {
      log.push({
        row_number: rowNumber,
        id,
        effective_date: effectiveIso,
        action: 'skip-already-anon',
        reason: 'columnas C/D/E/K/L ya anonimizadas',
      });
      continue;
    }

    const redactedRow: Row = row.slice();
    for (const c of REDACT_COLS) redactedRow[c] = REDACTED;
    // Garantiza 13 columnas (M vacía si venía undefined, para no borrar accidentalmente).
    while (redactedRow.length < 13) redactedRow.push('');

    updates.push({
      range: `${tab}!A${rowNumber}:M${rowNumber}`,
      row: redactedRow,
    });
    log.push({
      row_number: rowNumber,
      id,
      effective_date: effectiveIso,
      action: 'redact',
      reason: `edad efectiva >= ${RETENTION_MONTHS} meses`,
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const logPath = `anonymize-log-${today}.csv`;
  await writeLog(logPath, log);

  const redactCount = updates.length;
  console.log(
    `[anonymize] filas evaluadas: ${values.length - 1} | a redactar: ${redactCount} | log: ${logPath}`,
  );

  if (!apply) {
    console.log('[anonymize] --dry-run (sin --apply): no se escribe en el Sheet.');
    return;
  }

  if (redactCount === 0) {
    console.log('[anonymize] nada que aplicar.');
    return;
  }

  // batchUpdate: 1 llamada en lugar de N.
  const data = updates.map((u) => ({
    range: u.range,
    values: [u.row.map((v) => (v === undefined || v === null ? '' : v))],
  }));
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'RAW',
      data,
    },
  });
  console.log(`[anonymize] aplicados ${redactCount} redactados.`);
}

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Variable requerida ausente: ${key}`);
  return v;
}

function asString(v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return undefined;
}

function parseIso(s: string): number | null {
  if (!s) return null;
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? ms : null;
}

async function writeLog(path: string, entries: LogEntry[]): Promise<void> {
  const header = 'row_number,id,effective_date,action,reason';
  const lines = entries.map(
    (e) => `${e.row_number},${csv(e.id)},${csv(e.effective_date)},${csv(e.action)},${csv(e.reason)}`,
  );
  await fs.writeFile(path, [header, ...lines].join('\n') + '\n', 'utf8');
}

function csv(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

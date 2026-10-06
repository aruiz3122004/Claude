import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'reservas.db');
const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS reservas (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL,
    email TEXT NOT NULL,
    servicio TEXT NOT NULL,
    mensaje TEXT,
    origen TEXT DEFAULT 'web-landing',
    estado TEXT DEFAULT 'pendiente'
  );
  CREATE INDEX IF NOT EXISTS idx_reservas_timestamp ON reservas(timestamp);
`);

console.log('✅ Base de datos SQLite inicializada exitosamente en:', dbPath);

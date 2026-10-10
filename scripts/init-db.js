import { createClient } from "@libsql/client";

// Crear conexión usando las variables de entorno de Turso (Render / local)
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function initDb() {
  try {
    // Crear la tabla en la nube de Turso
    await db.execute(`
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
    `);

    // Crear el índice
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_reservas_timestamp ON reservas(timestamp);
    `);

    console.log('✅ Base de datos de Turso inicializada exitosamente en la nube.');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos en Turso:', error);
  }
}

initDb();
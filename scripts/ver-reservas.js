/**
 * Script para visualizar las reservas de Puerta Samaria en la base de datos SQLite.
 * Ejecutar con: npm run ver-reservas (o node scripts/ver-reservas.js)
 */
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), 'data', 'reservas.db');

if (!fs.existsSync(dbPath)) {
  console.log('\n⚠️  Aún no existe el archivo de base de datos en: ' + dbPath);
  console.log('Envía tu primera reserva desde el formulario web para generarlo automáticamente.\n');
  process.exit(0);
}

try {
  const db = new DatabaseSync(dbPath);

  // Consulta con conversión a hora local del sistema
  const rows = db.prepare(`
    SELECT 
      id,
      strftime('%d/%m/%Y %H:%M', timestamp, 'localtime') as fecha_local,
      nombre,
      telefono,
      email,
      servicio,
      mensaje,
      estado
    FROM reservas
    ORDER BY timestamp DESC
  `).all();

  console.log('\n========================================================================');
  console.log(`🌴 PUERTA SAMARIA — BASE DE DATOS SQLITE`);
  console.log(`📋 Total de reservas registradas: ${rows.length}`);
  console.log(`💾 Archivo local: ${dbPath}`);
  console.log('========================================================================\n');

  if (rows.length === 0) {
    console.log('No hay reservas registradas todavía en la base de datos.\n');
  } else {
    // 1. Vista en tarjetas individuales detalladas (muy legible en cualquier ancho de terminal)
    rows.forEach((r, idx) => {
      console.log(`┌── [RESERVA #${idx + 1}] ID: ${r.id} ─────────────────────────────`);
      console.log(`│ 📅 Fecha:    ${r.fecha_local} (Hora local)`);
      console.log(`│ 👤 Cliente:  ${r.nombre}`);
      console.log(`│ 📞 Teléfono: ${r.telefono}`);
      console.log(`│ ✉️  Correo:   ${r.email}`);
      console.log(`│ 🏖️  Servicio: ${r.servicio.toUpperCase()}`);
      console.log(`│ 📌 Estado:   ${(r.estado || 'pendiente').toUpperCase()}`);
      if (r.mensaje) {
        console.log(`│ 💬 Mensaje:  "${r.mensaje}"`);
      }
      console.log(`└──────────────────────────────────────────────────────────\n`);
    });

    // 2. Tabla compacta sin desbordamiento
    const tablaCompacta = rows.map((r, i) => ({
      '#': i + 1,
      ID: r.id,
      Fecha: r.fecha_local,
      Cliente: r.nombre.length > 18 ? r.nombre.substring(0, 16) + '..' : r.nombre,
      Teléfono: r.telefono,
      Servicio: r.servicio,
      Estado: r.estado || 'pendiente'
    }));

    console.log('📊 Resumen general:');
    console.table(tablaCompacta);
    console.log(`Total: ${rows.length} reserva(s) registrada(s).\n`);
  }
} catch (err) {
  console.error('Error al consultar SQLite:', err.message);
}

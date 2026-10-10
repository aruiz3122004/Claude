import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function verReservas() {
  try {
    // Consulta a Turso
    const result = await db.execute(`
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
    `);

    const rows = result.rows;

    console.log('\n========================================================================');
    console.log(`🌴 PUERTA SAMARIA — BASE DE DATOS TURSO (NUBE)`);
    console.log(`📋 Total de reservas registradas: ${rows.length}`);
    console.log('========================================================================\n');

    if (rows.length === 0) {
      console.log('No hay reservas registradas todavía en la base de datos de Turso.\n');
    } else {
      rows.forEach((r, idx) => {
        console.log(`┌── [RESERVA #${idx + 1}] ID: ${r.id} ─────────────────────────────`);
        console.log(`│ 📅 Fecha:    ${r.fecha_local}`);
        console.log(`│ 👤 Cliente:  ${r.nombre}`);
        console.log(`│ 📞 Teléfono: ${r.telefono}`);
        console.log(`│ ✉️  Correo:   ${r.email}`);
        console.log(`│ 🏖️  Servicio: ${String(r.servicio).toUpperCase()}`);
        console.log(`│ 📌 Estado:   ${String(r.estado || 'pendiente').toUpperCase()}`);
        if (r.mensaje) {
          console.log(`│ 💬 Mensaje:  "${r.mensaje}"`);
        }
        console.log(`└──────────────────────────────────────────────────────────\n`);
      });

      const tablaCompacta = rows.map((r, i) => ({
        '#': i + 1,
        ID: r.id,
        Fecha: r.fecha_local,
        Cliente: String(r.nombre).length > 18 ? String(r.nombre).substring(0, 16) + '..' : r.nombre,
        Teléfono: r.telefono,
        Servicio: r.servicio,
        Estado: r.estado || 'pendiente'
      }));

      console.log('📊 Resumen general:');
      console.table(tablaCompacta);
      console.log(`Total: ${rows.length} reserva(s) en la nube.\n`);
    }
  } catch (err) {
    console.error('❌ Error al consultar Turso:', err.message);
  }
}

verReservas();

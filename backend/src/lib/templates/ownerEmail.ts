import type { Quote } from '@metalurgica/database';

/**
 * Email al dueño con los detalles de la cotización.
 * Sin JS, sin tracking pixels, sin externo. Texto plano + HTML seguro.
 */
export function ownerEmailSubject(q: Quote): string {
  return `Nueva cotización — ${q.servicio} — ${q.id}`;
}

export function ownerEmailText(q: Quote): string {
  return [
    `Nueva cotización recibida (${q.id})`,
    `Fecha: ${q.timestamp}`,
    `Servicio: ${q.servicio}`,
    `Nombre: ${q.nombre}`,
    `Teléfono: ${q.telefono}`,
    `Email: ${q.email}`,
    `Mensaje:`,
    q.mensaje,
    ``,
    `Origen: ${q.origen}`,
    `Consentimiento v${q.consentimiento_version}: aceptado`,
  ].join('\n');
}

export function ownerEmailHtml(q: Quote): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return `<!doctype html>
<html lang="es"><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
  <h2>Nueva cotización — ${esc(q.servicio)}</h2>
  <p><strong>ID:</strong> ${esc(q.id)}<br>
     <strong>Fecha:</strong> ${esc(q.timestamp)}</p>
  <table cellpadding="6" style="border-collapse:collapse">
    <tr><td><strong>Nombre</strong></td><td>${esc(q.nombre)}</td></tr>
    <tr><td><strong>Teléfono</strong></td><td>${esc(q.telefono)}</td></tr>
    <tr><td><strong>Email</strong></td><td>${esc(q.email)}</td></tr>
    <tr><td><strong>Servicio</strong></td><td>${esc(q.servicio)}</td></tr>
    <tr><td><strong>Origen</strong></td><td>${esc(q.origen)}</td></tr>
  </table>
  <h3>Mensaje</h3>
  <pre style="white-space:pre-wrap;background:#f6f6f6;padding:12px;border-radius:6px">${esc(q.mensaje)}</pre>
  <p style="color:#666;font-size:12px">Consentimiento v${esc(q.consentimiento_version)} aceptado.</p>
</body></html>`;
}

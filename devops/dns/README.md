# devops/dns — Checklist DNS y correo transaccional

Estado: **pendiente de dominio**. Toda referencia a `[PENDIENTE_USUARIO: dominio]` debe reemplazarse cuando el cliente adquiera el dominio final (por ejemplo `metalurgicadelcaribe.co`).

> **Recordatorio round 2 (2026-10-02):** SPF, DKIM y DMARC de Resend quedan **bloqueados** hasta que el usuario entregue el dominio final (decisión D1 del audit). Mientras tanto, Resend enviará desde su dominio compartido (`onboarding@resend.dev`) y los correos pueden ir a spam. No se puede validar `dig` ni cerrar AU-B-04 hasta que D1 se resuelva. Asignación [devops] AU-B-04 permanece abierta.

## 1. Registros DNS para Vercel

Una vez el dominio apunte a los nameservers del registrador y Vercel lo verifique:

| Tipo | Nombre | Valor | TTL | Proposito |
|------|--------|-------|-----|-----------|
| A | `@` | `76.76.21.21` | 3600 | Apex -> Vercel (verificar valor actual en el dashboard de Vercel al momento de configurar) |
| CNAME | `www` | `cname.vercel-dns.com` | 3600 | Redireccion `www` -> apex |

Vercel genera certificado TLS automaticamente (Let's Encrypt). Verificar HSTS activo tras 24 h.

## 2. Registros para Resend (correo transaccional)

Resend provee los valores exactos tras verificar el dominio en su dashboard. Los nombres de registro tipicos son:

| Tipo | Nombre | Valor | Proposito |
|------|--------|-------|-----------|
| TXT | `@` | `v=spf1 include:_spf.resend.com -all` | SPF: autoriza a Resend a enviar en nombre del dominio |
| TXT | `resend._domainkey` o `[PENDIENTE_USUARIO: dkim-selector]._domainkey` | `[PENDIENTE_USUARIO: dkim-public-key]` | DKIM: firma criptografica (Resend entrega la clave publica) |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@[PENDIENTE_USUARIO: dominio]; adkim=s; aspf=s` | DMARC: politica anti-spoofing |
| MX | `send` (subdominio) | `feedback-smtp.us-east-1.amazonses.com` prioridad 10 (o el que indique Resend) | Return-path |

Nota: Resend puede pedir usar un subdominio dedicado (`send.[PENDIENTE_USUARIO: dominio]`). Preferir esta opcion para no afectar correo humano del dominio raiz.

## 3. Checklist de verificacion

Antes de considerar el correo listo:

- [ ] Dominio verificado en Vercel (status "Valid Configuration").
- [ ] Certificado TLS activo (Vercel badge verde).
- [ ] Dominio verificado en Resend (status "Verified").
- [ ] SPF resuelve y es correcto:
  ```
  dig TXT [PENDIENTE_USUARIO: dominio] +short | grep spf1
  ```
- [ ] DKIM resuelve:
  ```
  dig TXT [PENDIENTE_USUARIO: dkim-selector]._domainkey.[PENDIENTE_USUARIO: dominio] +short
  ```
- [ ] DMARC resuelve:
  ```
  dig TXT _dmarc.[PENDIENTE_USUARIO: dominio] +short
  ```
- [ ] Envio de prueba desde Resend llega sin advertencias a Gmail (ver cabeceras: SPF=pass, DKIM=pass, DMARC=pass).
- [ ] Chequeo externo opcional: https://www.mail-tester.com/ con puntuacion >= 9/10.
- [ ] HSTS verificado:
  ```
  curl -sI https://[PENDIENTE_USUARIO: dominio] | grep -i strict-transport-security
  ```

## 4. Rollback de DNS

Si el correo cae tras un cambio DNS:
1. Revertir el ultimo TXT modificado al valor anterior (guardar siempre el valor previo antes de editar).
2. Esperar propagacion (TTL + ~15 min).
3. Verificar con los comandos `dig` anteriores.
4. Si el fallo es de Vercel, usar el dominio preview `[PENDIENTE_USUARIO: dominio-preview]` como fallback temporal.

## 5. Runbook de restore de Sheet (RTO 4 h)

1. Confirmar incidente (dueno reporta datos faltantes / Sheet borrado).
2. Google Drive -> Papelera: buscar el Sheet (retencion 30 dias). Si existe, restaurar.
3. Si no esta en papelera, descargar el ultimo CSV de `backups/` del repo.
4. Crear nuevo Sheet, File -> Import -> CSV, replace sheet.
5. Compartir con el Service Account (`client_email` del `GOOGLE_SA_JSON`) con rol Editor.
6. Copiar el nuevo `SHEET_ID` de la URL.
7. Vercel UI -> Settings -> Environment Variables -> actualizar `SHEET_ID` en Production.
8. Vercel UI -> Deployments -> Redeploy ultimo build.
9. Validar enviando una cotizacion de prueba (`POST /api/quotes` desde el formulario).

Ensayo obligatorio: primera semana post-launch y despues anualmente.

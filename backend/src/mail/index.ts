import type { Env } from '../config/env.js';
import type { MailProvider } from './MailProvider.js';
import { ResendMailProvider } from './ResendMailProvider.js';
import { SmtpMailProvider } from './SmtpMailProvider.js';

let cached: MailProvider | null = null;

/**
 * Factory singleton por invocación. Lee `MAIL_PROVIDER`.
 */
export function getMailProvider(env: Env): MailProvider {
  if (cached) return cached;
  if (env.MAIL_PROVIDER === 'smtp') {
    cached = new SmtpMailProvider({
      host: env.SMTP_HOST!,
      port: env.SMTP_PORT!,
      secure: env.SMTP_SECURE ?? false,
      user: env.SMTP_USER!,
      pass: env.SMTP_PASS!,
      from: env.FROM_EMAIL,
    });
  } else {
    cached = new ResendMailProvider(env.RESEND_API_KEY!, env.FROM_EMAIL);
  }
  return cached;
}

export type { MailProvider } from './MailProvider.js';

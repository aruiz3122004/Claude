import { Resend } from 'resend';
import type { MailProvider, SendArgs, SendResult } from './MailProvider.js';

export class ResendMailProvider implements MailProvider {
  private readonly client: Resend;

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {
    this.client = new Resend(apiKey);
  }

  async send(args: SendArgs): Promise<SendResult> {
    const payload: Parameters<Resend['emails']['send']>[0] = {
      from: this.from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    };
    if (args.replyTo) payload.replyTo = args.replyTo;

    const { data, error } = await this.client.emails.send(payload);
    if (error || !data?.id) {
      throw new Error(`resend_send_failed: ${error?.message ?? 'unknown'}`);
    }
    return { id: data.id };
  }

  async ping(): Promise<boolean> {
    // Resend no expone /ping. Validar formato de API key sin consumir cuota.
    return typeof this.apiKey === 'string' && this.apiKey.startsWith('re_');
  }
}

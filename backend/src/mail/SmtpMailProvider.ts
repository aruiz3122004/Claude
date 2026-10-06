import nodemailer, { type Transporter } from 'nodemailer';
import type { MailProvider, SendArgs, SendResult } from './MailProvider.js';

export interface SmtpOptions {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export class SmtpMailProvider implements MailProvider {
  private readonly transporter: Transporter;

  constructor(private readonly opts: SmtpOptions) {
    this.transporter = nodemailer.createTransport({
      host: opts.host,
      port: opts.port,
      secure: opts.secure,
      auth: { user: opts.user, pass: opts.pass },
      connectionTimeout: 3_000,
      greetingTimeout: 3_000,
      socketTimeout: 5_000,
    });
  }

  async send(args: SendArgs): Promise<SendResult> {
    const info = await this.transporter.sendMail({
      from: this.opts.from,
      to: args.to,
      subject: args.subject,
      text: args.text,
      html: args.html,
      replyTo: args.replyTo,
    });
    return { id: info.messageId };
  }

  async ping(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}

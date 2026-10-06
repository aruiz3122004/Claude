export interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface SendResult {
  id: string;
}

export interface MailProvider {
  send(args: SendArgs): Promise<SendResult>;
  ping(): Promise<boolean>;
}

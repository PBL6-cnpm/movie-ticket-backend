export interface IEmail {
  fromAddress?: string;
  toAddress: string;
  subject: string;
  template: string;
  options?: MailOptions;
}

export interface IEmailQueue {
  data: IEmail;
}

interface MailOptions {
  template?: string;
  context?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: string | Buffer;
  }>;
}

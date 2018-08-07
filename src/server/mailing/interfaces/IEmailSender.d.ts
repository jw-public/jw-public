
export interface IEmailSendOptions {
    from?: string;
    to?: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string | string[];
    subject?: string;
    text?: string;
    html?: string;
}

/** I send an email to given mail address */
export interface IEmailSender {
  send(options: IEmailSendOptions);
}

/** I send mails to a given user */


export interface IUserMailerOptions {
  recepientId?: string;
  subject?: string;
  markdownContent?: string;
  replyToAddress?: string;
}

/** I send an email to given mail address */
export interface IUserMailer {
  send(options: IUserMailerOptions);
}

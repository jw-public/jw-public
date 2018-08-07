import { Logger } from '../../../imports/logging/Logger';
import { LoggerFactory } from '../../../imports/logging/LoggerFactory';
import { Types } from "../../Types";
import { MailingTypes } from "../MailingTypes";
import { UserTypes } from "../../user/UserTypes";

import { IUserMailer, IUserMailerOptions } from "../interfaces/IUserMailer";
import { IEmailSender, IEmailSendOptions } from "../interfaces/IEmailSender";

import { IUserFactory } from "../../user/interfaces/IUserFactory";

import { injectable, inject, named } from "inversify";
import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";
import { Meteor } from "meteor/meteor"

import * as marked from 'marked';
import * as removeMarkdown from 'remove-markdown';

@injectable()
export class UserMailer implements IUserMailer {
  private logger: Logger;


  constructor( @inject(MailingTypes.IEmailSender) private mailSender: IEmailSender,
    @inject(UserTypes.IUserFactory) private userFactory: IUserFactory,
    @inject(Types.LoggerFactory) loggerFactory: LoggerFactory,
  ) {

    if (loggerFactory) {
      this.logger = loggerFactory.createLogger("UserMailer");
    }

  }


  public send(options: IUserMailerOptions) {
    let user = this.userFactory.createUser(options.recepientId);

    if (!user.exists()) {
      return;
    }

    let userEmail = user.getEmailAddress();

    this.logger.info("Sending mail to " + userEmail);


    let senderEmail = "'PublicAssistant' <no-reply@jw-public.org>";
    let replyTo = senderEmail;
    if (options.replyToAddress && options.replyToAddress.includes("@")) {
      replyTo = options.replyToAddress;
    }

    this.mailSender.send({
      replyTo: replyTo,
      from: senderEmail,
      to: userEmail,
      subject: options.subject,
      text: removeMarkdown(options.markdownContent),
      html: marked(options.markdownContent)
    });
  }

}

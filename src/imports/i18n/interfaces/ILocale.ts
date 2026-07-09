export interface IAssignmentEmailLocale {
  subject(
    eventName: "accept" | "cancellation" | "modification",
    assignmentName: string,
    date: string,
  ): string;
  message: {
    accepted(assignmentName: string, date: string): string;
    removed(assignmentName: string, date: string): string;
    modified(assignmentName: string, date: string): string;
    canceled(assignmentName: string, date: string, reason: string): string;
    reenabled(assignmentName: string, date: string, reason: string): string;
  };
  linkToAssignment: string;
  footer: {
    closing: string;
    noReplyInformation: string;
    replyInformation: string;
  };
}

/** E-Mail an Koordinatoren: neue Bewerbung auf einen Einsatz ihrer Gruppe. */
export interface IApplicationEmailLocale {
  subject(assignmentName: string, date: string): string;
  message(applicantName: string, assignmentName: string, date: string): string;
  linkToAssignment: string;
}

/** Erinnerungs-E-Mail an Teilnehmer vor Beginn eines Einsatzes. */
export interface IReminderEmailLocale {
  subject(assignmentName: string, date: string): string;
  message(assignmentName: string, date: string): string;
  linkToAssignment: string;
}

export interface ILocale {
  hello: string;
  assignmentEmail: IAssignmentEmailLocale;
  applicationEmail: IApplicationEmailLocale;
  reminderEmail: IReminderEmailLocale;
  dateFormats: {
    shortDateTime: string;
    longDateTime: string;
  };
}

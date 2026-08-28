import { IAssignmentEmailLocale, ILocale } from "../interfaces/ILocale";

const assignmentLocale: IAssignmentEmailLocale = {
  subject(eventName: "accept" | "cancellation" | "modification", assignmentName, date): string {
    let begin: string;
    switch (eventName) {
      case "accept":
        begin = "Zusage";
        break;
      case "cancellation":
        begin = "Absage";
        break;
      case "modification":
        begin = "Änderung";
        break;
    }

    return `${begin} für den Termin ${assignmentName} am ${date}`;
  },
  message: {
    accepted(assignmentName: string, dateTime: string): string {
      return `wir freuen uns über deine Teilnahme am Termin ${assignmentName} am ${dateTime}!`;
    },
    removed(assignmentName: string, dateTime: string): string {
      return `leider ist deine Teilnahme am Termin ${assignmentName} am ${dateTime} nicht möglich!`;
    },
    modified(assignmentName: string, dateTime: string): string {
      return `beim Termin ${assignmentName} am ${dateTime} gab es eine Änderung.
Bitte informiere dich über den Status des Termins und ob er stattfinden kann.`;
    },
    canceled(assignmentName: string, dateTime: string, reason: string): string {
      return `leider musste der Termin ${assignmentName} am ${dateTime} abgesagt werden.
Der Grund: ${reason}.`;
    },
    reenabled(assignmentName: string, dateTime: string, reason: string): string {
      return `wir freuen uns, dass der Termin ${assignmentName} am ${dateTime} nun doch stattfinden kann.
Der Grund: ${reason}.`;
    },
  },
  linkToAssignment: "Link zum Termin",
  footer: {
    closing: "Deine Brüder der Trolleyorganisation.",
    noReplyInformation: `Bitte antworte nicht direkt auf diese E-Mail!
Wenn du mit der zugeteilten Ansprechperson Kontakt aufnehmen möchtest, klicke auf den oben genannten Link. 
Dort findest du die Kontaktdaten.`,
    replyInformation: `Wenn du mit der zugeteilten Ansprechperson Kontakt aufnehmen möchtest, klicke auf den oben genannten Link. 
Dort findest du die Kontaktdaten. Bitte sende uns deinen Bericht dieser Schicht an diese Adresse: `,
  },
};

export const messages: ILocale = {
  hello: "Hallo",
  assignmentEmail: assignmentLocale,
  assignmentFullEmail: {
    subject(assignmentName: string, date: string): string {
      return `Termin ${assignmentName} am ${date} ist voll`;
    },
    message(assignmentName: string, date: string): string {
      return `der Termin ${assignmentName} am ${date} ist voll. Bitte bestätige die Bewerber und schließe den Termin ab.`;
    },
    toConfirm: "Zu bestätigen",
    linkToAssignment: "Link zum Termin",
  },
  reminderEmail: {
    subject(assignmentName: string, date: string): string {
      return `Erinnerung: Termin ${assignmentName} am ${date}`;
    },
    message(assignmentName: string, date: string): string {
      return `dein Termin ${assignmentName} am ${date} steht bevor. Wir freuen uns auf dich!`;
    },
    linkToAssignment: "Link zum Termin",
  },
  dateFormats: {
    shortDateTime: "llll",
    longDateTime: "dddd, Do MMM [um] LT",
  },
};

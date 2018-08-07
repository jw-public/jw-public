import { IAssignmentEmailLocale, ILocale } from '../interfaces/ILocale';

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

        return `${begin} für Trolley ${assignmentName} am ${date}`;
    },
    message: {
        accepted(assignmentName: string, dateTime: string): string {
            return `wir freuen uns über deine Teilnahme am Trolleydienst ${assignmentName} am ${dateTime}!`;
        },
        removed(assignmentName: string, dateTime: string): string {
            return `leider ist deine Teilnahme am Trolleydienst ${assignmentName} am ${dateTime} nicht möglich!`;
        },
        modified(assignmentName: string, dateTime: string): string {
            return `bei der Trolleyschicht ${assignmentName} am ${dateTime} gab es eine Änderung.
Bitte informiere dich über den Status des Termins und ob er stattfinden kann.`;
        },
        canceled(assignmentName: string, dateTime: string, reason: string): string {
            return `leider musste die Trolleyschicht ${assignmentName} am ${dateTime} abgesagt werden.
Der Grund: ${reason}.`;
        },
        reenabled(assignmentName: string, dateTime: string, reason: string): string {
            return `wir freuen uns, dass der Trolleydienst ${assignmentName} am ${dateTime} nun doch statt finden kann.
Der Grund: ${reason}.`;
        }

    },
    linkToAssignment: "Link zum Termin",
    footer: {
        closing: "Deine Brüder der Trolleyorganisation.",
        additionalInformation: `Bitte antworte nicht direkt auf diese E-Mail!
Wenn du mit der zugeteilten Ansprechperson Kontakt aufnehmen möchtest, klicke auf den oben genannten Link. 
Dort findest du die Kontaktdaten.`
    }




}

export const messages: ILocale = {
    hello: "Hallo",
    assignmentEmail: assignmentLocale,
    dateFormats:
    {
        shortDateTime: "llll",
        longDateTime: "dddd, Do MMM [um] LT"
    }

};
import { IAssignmentEmailLocale, ILocale } from "../interfaces/ILocale";

const assignmentLocale: IAssignmentEmailLocale = {
  subject(eventName: "accept" | "cancellation" | "modification", assignmentName, date): string {
    let subject: string;
    switch (eventName) {
      case "accept":
        subject = `Ta demande de participation pour le présentoir ${assignmentName}, le ${date} a été acceptée`;
        break;
      case "cancellation":
        subject = `Ta demande de participation pour le présentoir ${assignmentName}, le ${date} a été refusée`;
        break;
      case "modification":
        subject = `Changement pour le service du présentoir ${assignmentName}, le ${date}`;
        break;
    }

    return subject;
  },
  message: {
    accepted(assignmentName: string, date: string): string {
      return `Merci pour ta participation au service du présentoir ${assignmentName} le ${date}.`;
    },
    removed(assignmentName: string, date: string): string {
      return `Malheureusement ta participation au service du présentoir ${assignmentName} le ${date} ne sera pas possible.`;
    },
    modified(assignmentName: string, date: string): string {
      return `il y a eu des changements concernant le service du présentoir ${assignmentName} le ${date}.\nMerci de vérifier si ce service peut toujours avoir lieu.`;
    },
    canceled(assignmentName: string, date: string, reason: string): string {
      return `Malheureusement le service du présentoir ${assignmentName} le ${date} e pourra pas avoir lieu. La raison : ${reason}.`;
    },
    reenabled(assignmentName: string, date: string, reason: string): string {
      return `Le service du présentoir ${assignmentName} le ${date} ne pourra pas avoir lieu. La raison : ${reason}`;
    },
  },
  linkToAssignment: "Voici le lien pour plus d’information",
  footer: {
    closing: "Tes frères responsables du service présentoir",
    noReplyInformation: `Ne réponds pas à ce message, s’il te plaît.
Si tu veux contacter ton responsable, clique sur le lien ci-dessus pour y trouver ses coordonnées.`,
    replyInformation: `Si tu veux contacter ton responsable, clique sur le lien ci-dessus pour y trouver ses coordonnées.`,
  },
};

export const messages: ILocale = {
  hello: "Bonjour",
  assignmentEmail: assignmentLocale,
  assignmentFullEmail: {
    subject(assignmentName: string, date: string): string {
      return `Le présentoir ${assignmentName}, le ${date} est complet`;
    },
    message(assignmentName: string, date: string): string {
      return `le service du présentoir ${assignmentName} le ${date} est complet. Merci de confirmer les candidats et de clôturer ce service.`;
    },
    toConfirm: "À confirmer",
    linkToAssignment: "Voici le lien pour plus d’information",
  },
  reminderEmail: {
    subject(assignmentName: string, date: string): string {
      return `Rappel : présentoir ${assignmentName}, le ${date}`;
    },
    message(assignmentName: string, date: string): string {
      return `ton service du présentoir ${assignmentName} le ${date} approche. Nous nous réjouissons de te voir !`;
    },
    linkToAssignment: "Voici le lien pour plus d’information",
  },
  dateFormats: {
    shortDateTime: "ddd L hh[h]mm",
    longDateTime: "dddd, [le] Do MMM YYYY [à] hh[h]mm",
  },
};

import { IAssignmentEmailLocale, ILocale } from '../interfaces/ILocale';

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
            return `there were changes concerning the trolley ${assignmentName} on ${date}.\nPlease inform yourself if your trolley assignment can still take place.`;
        },
        canceled(assignmentName: string, date: string, reason: string): string {
            return `Malheureusement le service du présentoir ${assignmentName} le ${date} e pourra pas avoir lieu. La raison : ${reason}.`;
        },
        reenabled(assignmentName: string, date: string, reason: string): string {
            return `Le service du présentoir ${assignmentName} le ${date} ne pourra pas avoir lieu. La raison : ${reason}`;
        }

    },
    linkToAssignment: "Voici le lien pour plus d’information",
    footer: {
        closing: "Tes frères responsables du service présentoir",
        noReplyInformation: `Ne réponds pas à ce message, s’il te plaît.
Si tu veux contacter ton responsable, clique sur le lien ci-dessus pour y trouver ses coordonnées.`,
        replyInformation: `Si tu veux contacter ton responsable, clique sur le lien ci-dessus pour y trouver ses coordonnées.`
    }

};

export const messages: ILocale = {
    hello: "Bonjour",
    assignmentEmail: assignmentLocale,
    dateFormats:
    {
        shortDateTime: "ddd L hh[h]mm",
        longDateTime: "dddd, [le] Do MMM YYYY [à] hh[h]mm"
    }
};
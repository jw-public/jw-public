import { IAssignmentEmailLocale, ILocale } from '../interfaces/ILocale';

const assignmentLocale: IAssignmentEmailLocale = {
    subject(eventName: "accept" | "cancellation" | "modification", assignmentName, date): string {
        let subject: string;
        switch (eventName) {
            case "accept":
                subject = `Accepted for Trolley ${assignmentName} on ${date}`;
                break;
            case "cancellation":
                subject = `Negative reply for Trolley ${assignmentName} on ${date}`;
                break;
            case "modification":
                subject = `Changes for Trolley ${assignmentName} on ${date}`;
                break;
        }

        return subject;
    },
    message: {
        accepted(assignmentName: string, date: string): string {
            return `we are happy to see you participating at the trolley ${assignmentName} on ${date}!`;
        },
        removed(assignmentName: string, date: string): string {
            return `unfortunately your participation at the trolley ${assignmentName} on ${date} is not possible.`;
        },
        modified(assignmentName: string, date: string): string {
            return `there were changes concerning the trolley ${assignmentName} on ${date}.\nPlease inform yourself if your trolley assignment can still take place.`;
        },
        canceled(assignmentName: string, date: string, reason: string): string {
            return `unfortunately the trolley ${assignmentName} on ${date} had to be canceled. The reason is ${reason}.`;
        },
        reenabled(assignmentName: string, date: string, reason: string): string {
            return `we are happy to tell you the trolley ${assignmentName} on ${date} takes place. The reason is ${reason}`;
        }

    },
    linkToAssignment: "Link to assignment",
    footer: {
        closing: "Brotherly love from your cart planning team.",
        additionalInformation: `Please don't reply to this email!
If you want to contact the assigned contact person please click on the upper link.
There you will find the contact details.`
    }

};

export const messages: ILocale = {
    hello: "Hello",
    assignmentEmail: assignmentLocale,
    dateFormats:
    {
        shortDateTime: "llll",
        longDateTime: "dddd, Do MMM [at] LT"
    }
};
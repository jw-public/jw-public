import { IAssignmentEmailLocale, ILocale } from "../interfaces/ILocale";

const assignmentLocale: IAssignmentEmailLocale = {
  subject(eventName: "accept" | "cancellation" | "modification", assignmentName, date): string {
    let subject: string;
    switch (eventName) {
      case "accept":
        subject = `Accepted for assignment ${assignmentName} on ${date}`;
        break;
      case "cancellation":
        subject = `Negative reply for assignment ${assignmentName} on ${date}`;
        break;
      case "modification":
        subject = `Changes for assignment ${assignmentName} on ${date}`;
        break;
    }

    return subject;
  },
  message: {
    accepted(assignmentName: string, date: string): string {
      return `we are happy to see you participating in the assignment ${assignmentName} on ${date}!`;
    },
    removed(assignmentName: string, date: string): string {
      return `unfortunately your participation in the assignment ${assignmentName} on ${date} is not possible.`;
    },
    modified(assignmentName: string, date: string): string {
      return `there were changes concerning the assignment ${assignmentName} on ${date}.\nPlease check whether it can still take place.`;
    },
    canceled(assignmentName: string, date: string, reason: string): string {
      return `unfortunately the assignment ${assignmentName} on ${date} had to be canceled. The reason is ${reason}.`;
    },
    reenabled(assignmentName: string, date: string, reason: string): string {
      return `we are happy to tell you the assignment ${assignmentName} on ${date} takes place. The reason is ${reason}`;
    },
  },
  linkToAssignment: "Link to assignment",
  footer: {
    closing: "Brotherly love from your cart planning team.",
    noReplyInformation: `Please don't reply to this email!
If you want to contact the assigned contact person please click on the upper link.
There you will find the contact details.`,
    replyInformation: `Please send us report of given copies to this address: `,
  },
};

export const messages: ILocale = {
  hello: "Hello",
  assignmentEmail: assignmentLocale,
  assignmentFullEmail: {
    subject(assignmentName: string, date: string): string {
      return `Assignment ${assignmentName} on ${date} is full`;
    },
    message(assignmentName: string, date: string): string {
      return `the assignment ${assignmentName} on ${date} is full. Please confirm the applicants and close it.`;
    },
    toConfirm: "To be confirmed",
    linkToAssignment: "Link to assignment",
  },
  reminderEmail: {
    subject(assignmentName: string, date: string): string {
      return `Reminder: Trolley ${assignmentName} on ${date}`;
    },
    message(assignmentName: string, date: string): string {
      return `your trolley ${assignmentName} on ${date} is coming up. We are looking forward to seeing you!`;
    },
    linkToAssignment: "Link to assignment",
  },
  dateFormats: {
    shortDateTime: "llll",
    longDateTime: "dddd, Do MMM [at] LT",
  },
};

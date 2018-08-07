export interface IAssignmentEmailLocale {
    subject(eventName: "accept" | "cancellation" | "modification", assignmentName: string, date: string): string
    message: {
        accepted(assignmentName: string, date: string): string,
        removed(assignmentName: string, date: string): string,
        modified(assignmentName: string, date: string): string,
        canceled(assignmentName: string, date: string, reason: string): string,
        reenabled(assignmentName: string, date: string, reason: string): string,
    },
    linkToAssignment: string,
    footer: {
        closing: string,
        additionalInformation: string
    }
}

export interface ILocale {
    hello: string,
    assignmentEmail: IAssignmentEmailLocale,
    dateFormats:
    {
        shortDateTime: string,
        longDateTime: string
    }
}
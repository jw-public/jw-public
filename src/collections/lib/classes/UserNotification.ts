import { check } from "meteor/check";
import { AssignmentEventType as AssignmentType } from "../../../imports/assignments/interfaces/AssignmentEventType";

import Assignment from "./Assignment";
import * as EnumUtil from "./EnumUtil";

import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import * as moment from "moment";
import "../ValidationFunctions/requiredFor";


export enum Type { Assignment, Simple };

export const NotificationNames = EnumUtil.getNames(Type);
export const AssignmentTypeNames = EnumUtil.getNames(AssignmentType);

// @see interface AssignmentOptions
export const AssignmentOptionsSchema = new SimpleSchema({
    /** Typ der Einsatz-Benachrichtigung */
    type: {
        type: String,
        allowedValues: AssignmentTypeNames
    },
    /** ID des Einsatzes */
    id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    /** Grund einer Re-Aktivierung eines Termins */
    reenablingReason: {
        type: String,
        trim: true,
        optional: true,
        requiredFor: AssignmentType[AssignmentType.Reenable]
    },
});

// @see interface NotificationData
export const NotificationDataSchema = new SimpleSchema({
    title: {
        type: String,
        trim: true
    },
    details: {
        type: String,
        trim: true
    },
    icon: {
        type: String,
        trim: true
    },
    hasLink: {
        type: Boolean,
    },
    link: {
        type: String,
        trim: true,
        regEx: SimpleSchema.RegEx.Url,
        optional: true,
        custom: function () {
            let context = <CustomValidatorContext>this;
            let customCondition = context.field("hasLink").value === true;
            if (customCondition && !context.isSet && (!context.operator || (context.value === null || context.value === ""))) {
                return "required";
            }
        }
    },

});

// @see interface NotificationDAO
export const NotificationSchema = new SimpleSchema({
    userId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        index: 1
    },
    type: {
        type: String,
        allowedValues: NotificationNames
    },
    when: {
        type: Date,
        index: -1, // Index auf absteigende Reihenfolge
        autoValue: function (): any {
            if (this.isInsert) {
                return new Date;
            } else if (this.isUpsert) {
                return { $setOnInsert: new Date };
            } else {
                this.unset();
            }
        }
    },
    seen: {
        type: Boolean,
        optional: true,
        autoValue: function () {
            let context = <CustomValidatorContext>this;
            let gotPushed = context.isUpdate && context.operator === "$push";

            if (context.isInsert || gotPushed) {
                return false;
            }
        }
    },
    seenDate: {
        type: Date,
        optional: true,
        custom: function () {
            let context = <CustomValidatorContext>this;
            let customCondition = context.field("seen").value === true;
            if (customCondition && !context.isSet && (!context.operator || (context.value === null || context.value === ""))) {
                return "required";
            }
        },
        autoValue: function () {
            let context = <CustomValidatorContext>this;
            let seenField = context.siblingField("seen");

            if (seenField.isSet && (seenField.value === true)) {
                return new Date();
            } else {
                context.unset(); // Prevent user from supplying his own value
            }
        }
    },
    assignmentOptions: {
        type: AssignmentOptionsSchema,
        optional: true,
        requiredFor: Type[Type.Assignment]
    },
    simpleData: {
        type: NotificationDataSchema,
        optional: true,
        requiredFor: Type[Type.Simple]
    }

});

export interface AssignmentOptionsParameters {
    /** Grund einer Re-Aktivierung eines Termins */
    reenablingReason?: string;
}

export interface AssignmentOptions extends AssignmentOptionsParameters {
    /** Typ der Einsatz-Benachrichtigung */
    type: string;
    /** ID des Einsatzes */
    id: string;
}

export interface NotificationDAO {
    _id?: string;
    type?: string;
    when?: Date;
    userId?: string;
    seen?: boolean;
    seenDate?: Date;
    assignmentOptions?: AssignmentOptions;
    simpleData?: DisplayableNotifcation;
}

export interface DisplayableNotifcation {
    title: string;
    details: string;
    icon: string;
    hasLink: boolean;
    link?: string;
}


export interface Wrapper extends DisplayableNotifcation {
    data: NotificationDAO;
}

export function wrap(notification: NotificationDAO): Wrapper {
    delete notification._id; // Remove _id field, becaus it is not in the schema
    check(notification, NotificationSchema);
    let wrapper: Wrapper = null;

    let type: Type = Type[notification.type];

    switch (type) {
        case Type.Assignment:
            wrapper = new AssignmentWrapper(notification);
            break;
        case Type.Simple:
            wrapper = new SimpleWrapper(notification);
            break;
    }
    return wrapper;
}


class AssignmentWrapper implements Wrapper {
    private dataAccessObject: NotificationDAO;
    private type: AssignmentType;
    private assignmentId: string;

    constructor(notification: NotificationDAO) {
        this.dataAccessObject = notification;
        this.type = AssignmentType[notification.assignmentOptions.type];
        this.assignmentId = this.dataAccessObject.assignmentOptions.id;

    }

    get title(): string {

        let title: string = "Terminbenachrichtigung"; // Default Wert
        switch (this.type) {
            case AssignmentType.Accept:
                title = "Anfrage angenommen";
                break;
            case AssignmentType.Cancel:
                title = "Termin abgesagt";
                break;
            case AssignmentType.Removed:
                title = "Termin Absage";
                break;
            case AssignmentType.Modified:
                title = "Termin Änderung";
                break;
        }

        return title;
    }

    get details(): string {
        let details: string = null; // Default Wert

        if (this.assignmentDoesExist()) {
            let assignment: Assignment = new Assignment(this.assignmentId);
            let date: string = moment(assignment.start).format("Do MMM LT");
            switch (this.type) {
                case AssignmentType.Accept:
                    details = `Du nimmst am Termin "${assignment.name}" teil.\nDatum: ${date}`;
                    break;
                case AssignmentType.Cancel:
                    details = `Der Termin "${assignment.name}" am ${date} wurde abgesagt: ${assignment.getDAO({ "cancelationReason": 1 }, true).cancelationReason}`;
                    break;
                case AssignmentType.Reenable:
                    details = `Der Termin "${assignment.name}" am ${date} findet doch statt: ${this.dataAccessObject.assignmentOptions.reenablingReason}`;
                    break;
                case AssignmentType.Removed:
                    details = `Leider konnte Deine Bewerbung zum Termin ${assignment.name} am ${date} nicht berücksichtigt werden.`;
                    break;
                case AssignmentType.Modified:
                    details = `Es gab eine Änderung beim Termin ${assignment.name} am ${date}.`;
                    break;
            }
        } else {
            details = "Der Termin wurde gelöscht.";
        }

        return details;
    }

    private assignmentDoesExist(): boolean {
        let assignment: Assignment = new Assignment(this.assignmentId);
        return typeof assignment.getDAO() !== "undefined";
    }



    get icon(): string {
        let logo: string = "fa fa-fw ";

        switch (this.type) {
            case AssignmentType.Accept:
                logo += "fa-calendar-check-o";
                break;
            case AssignmentType.Cancel:
                logo += "fa-ban";
                break;
            case AssignmentType.Reenable:
                logo += "fa-calendar-check-o";
                break;
            case AssignmentType.Removed:
                logo += "fa-calendar-times-o";
                break;
            case AssignmentType.Modified:
                logo += "fa-info-circle";
                break;
        }

        return logo;
    }

    get hasLink(): boolean {
        return this.assignmentDoesExist() && this.userWasNotRemovedFromAssignment();
    }

    private userWasNotRemovedFromAssignment(): boolean {
        return this.type !== AssignmentType.Removed;
    }

    get link(): string {
        return FlowRouter.path("singleAssignment", { assignmentId: this.dataAccessObject.assignmentOptions.id });
    }

    get data(): NotificationDAO {
        return this.dataAccessObject;
    }

}

class SimpleWrapper implements Wrapper {
    private dataAccessObject: NotificationDAO;
    private notificationData: DisplayableNotifcation;

    constructor(notification: NotificationDAO) {
        this.dataAccessObject = notification;
        this.notificationData = this.dataAccessObject.simpleData;
    }

    get title(): string {
        return this.notificationData.title;
    }

    get details(): string {
        return this.notificationData.details;
    }

    get icon(): string {
        return this.notificationData.icon;
    }

    get hasLink(): boolean {
        return this.notificationData.hasLink;
    }

    get link(): string {
        return this.notificationData.link;
    }

    get data(): NotificationDAO {
        return this.dataAccessObject;
    }

}

import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Session } from "meteor/session";
import { Mongo } from "meteor/mongo";

import Group from "./classes/Group";
import { GroupApplicationController } from "./classes/Group";
import { UserEntry, AssignmentDAO, Assignments } from "./AssignmentsCollection";
import { CollectionConf } from "./collectionConfig/CollectionConf";


import * as moment from "moment";

export const Groups: Mongo.Collection<GroupDAO> = new Mongo.Collection("groups");

/**
 * Group Data Access Object
 */
export interface GroupDAO {
    _id?: string;
    name?: string;
    additional?: string;
    coordinators?: Array<string>;
    createdAt?: Date;
    creator?: string;
    updatedAt?: Date;
    email?: string;
}

(<any>Groups).helpers({
    getUserCount: function () {
        return Meteor.users.find({ groups: { $in: [this._id] } }).count();

    },
    getApplicationsCount: function () { // Anzahl der Bewerbungen auf die Gruppe
        if (Meteor.isClient) {
            let applicationController = new GroupApplicationController(this._id);
            return applicationController.applicationsCount;
        } else {
            return Meteor.users.find({ "profile.pendingGroups": { $in: [this._id] } }).count();
        }
    },
    getAvailableTrolleyAssignmentsCount: function () {
        return this.getAvailableTrolleyAssignments().count();
    },
    getAvailableTrolleyAssignments: function () {
        return Assignments.find({ $and: [{ group: this._id }, { end: { $gte: moment().toDate() } }] });
    }
});

Groups.attachSchema(new SimpleSchema({
    name: {
        type: String,
        label: "Name",
        optional: false,
        max: 200,
        unique: true
    },
    additional: {
        type: String,
        label: "Zusätzliche Informationen",
        optional: true,
        max: 1000
    },
    coordinators: {
        type: Array,
        label: "Koordinatoren",
        optional: false,
        minCount: 0,
        maxCount: 255,
        defaultValue: []
    },
    "coordinators.$": {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    // Force value to be current date (on server) upon insert
    // and prevent updates thereafter.
    createdAt: {
        type: Date,
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
    creator: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        label: "Ersteller",
        optional: true,
        custom: function () {
            if (!CollectionConf.IS_TEST && !(this.isSet && this.value)) {
                return "required";
            }
        },
        autoValue: function (): any {

            if (Meteor.isServer && CollectionConf.IS_TEST) {
                this.unset();
                return;
            }

            if (this.isInsert) {
                return Meteor.userId();
            } else if (this.isUpsert) {
                return { $setOnInsert: Meteor.userId() };
            } else {
                this.unset();
            }
        }
    },
    // Force value to be current date (on server) upon update
    // and don't allow it to be set upon insert.
    updatedAt: {
        type: Date,
        autoValue: function () {
            if (this.isUpdate) {
                return new Date();
            }
        },
        denyInsert: true,
        optional: true
    },
    email: {
        type: String,
        label: "E-Mail",
        optional: true,
        max: 200,
        unique: false
    }
}));

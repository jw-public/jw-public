import * as _ from "underscore";
import { Meteor, Subscription } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Mongo } from "meteor/mongo";
import { Accounts } from "meteor/accounts-base";
import { Roles } from "meteor/alanning:roles";
import { check, Match } from "meteor/check";

import Group from "./lib/classes/Group";
import { GroupApplicationController } from "./lib/classes/Group";
import { Groups, GroupDAO } from "./lib/GroupCollection";

import User from "./lib/classes/User";
import * as UserCollection from "./lib/UserCollection";
import * as UserNotification from "./lib/classes/UserNotification";

import Assignment from "./lib/classes/Assignment";
import { AssignmentState } from "./lib/classes/AssignmentState";
import { UserEntry, AssignmentDAO, Assignments } from "./lib/AssignmentsCollection";

import { Tabular } from "meteor/aldeed:tabular";

import * as ManageAssignments from "../imports/templateModules/ManageAssignments";

import * as moment from "moment";
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';



export const TabularTables = {};
Meteor.isClient && Template.registerHelper('TabularTables', <any>TabularTables);
TabularTables["Groups"] = new Tabular.Table({
    name: "GroupList",
    collection: Groups,
    columns: [{
        data: "name",
        title: "Name"
    }, {
        data: "getUserCount()",
        title: "Mitglieder"
    }, {
        data: "getApplicationsCount()",
        title: "Bewerbungen"
    }, {
        tmpl: Meteor.isClient && Template["groupOptions"]
    }],
    allow: function (userId) {
        return Roles.userIsInRole(userId, ["admin"]); // Zugriffsberechtigung nur für Administratoren
    },
    "autoWidth": false,
    createdRow: function (row, data, dataIndex) {
        var instance = Template.instance();

        instance.subscribe("groupMembers", data._id);
    }
});
TabularTables["Users"] = new Tabular.Table({
    name: "UserList",
    collection: Meteor.users,
    columns: [{
        data: "profile.first_name",
        title: "Vorname"
    }, {
        data: "profile.last_name",
        title: "Nachname"
    }, {
        data: "profile.mobileNat",
        title: "Telefon"
    }, {
        data: "emails.0.address",
        title: "E-Mail"
    }, {
        data: "profile.zip",
        title: "PLZ"
    }, {
        tmpl: Meteor.isClient && Template["userOptions"]
    }],
    allow: function (userId) {
        return Roles.userIsInRole(userId, ["admin"]);
    },
    extraFields: ["groups", "notice", "profile"],
    "autoWidth": false
});
TabularTables["GroupApplicants"] = new Tabular.Table({
    name: "GroupApplicants",
    collection: Meteor.users,
    columns: [{
        data: "profile.first_name",
        title: "Vorname"
    }, {
        data: "profile.last_name",
        title: "Nachname"
    }, {
        data: "profile.mobileNat",
        title: "Telefon"
    }, {
        data: "emails.0.address",
        title: "E-Mail"
    }, {
        tmpl: Meteor.isClient && Template["applicantsOptions"]
    }],
    allow: function (userId) {
        // Wir holen uns einen Cursor auf alle Group-Objekte, in denen wir als Coordinator eingetragen sind
        var coordinatingGroupsCursor = Groups.find({
            coordinators: {
                $in: [userId]
            }
        }, {
            sort:
            {
                "_id": 1
            }
        });
        /**
         * Wir wandeln den Cursor in einen Array von Group-Objekten um.
         * Die Array-Elemente haben das Format: {"_id": "oASvwiu33872r827..."}
         * @type {Array}
         */
        var coordinatingGroups = coordinatingGroupsCursor.fetch();
        /**
         * Bestimmt, ob der User in irgendeiner Gruppe ein Koordinator ist.
         * @type {boolean}
         */
        var isCoordinatorInAnyGroup = coordinatingGroupsCursor.count() > 0;
        return Roles.userIsInRole(userId, ["admin"]) || isCoordinatorInAnyGroup; // Zugriffsberechtigung nur für Administratoren
    },
    selector: function (userId) {
        // Wir holen uns einen Cursor auf alle Group-Objekte, in denen wir als Coordinator eingetragen sind
        var coordinatingGroupsCursor = Groups.find({
            coordinators: {
                $in: [userId]
            }
        }, {
            sort:
            {
                "_id": 1
            }

        });
        /**
         * Wir wandeln den Cursor in einen Array von Group-Objekten um.
         * Die Array-Elemente haben das Format: {"_id": "oASvwiu33872r827..."}
         * @type {Array}
         */
        var coordinatingGroups = coordinatingGroupsCursor.fetch();
        /**
         * Wir bauen aus den Gruppen-Objekten einen Array aus IDs.
         * Entsprechen den IDs der Gruppen, deren Koordinator man ist.
         * Der Array wird das Format haben: arrayOfIds = ["FaF93h92pßvli286f28vv", "297ghb2pßvli286f28vv", ...]
         * @type {Array}
         */
        var arrayOfIds = [];
        // Mit einer Foreach-Schleife das Objekt-Array coordinatingGroups umwandeln in arrayOfIds.
        _.forEach(coordinatingGroups, function (group) {
            arrayOfIds.push(group._id);
        });
        return {
            "profile.pendingGroups": {
                $in: arrayOfIds
            }
        };
    },
    "autoWidth": false
});
TabularTables["GroupMembers"] = new Tabular.Table({
    name: "GroupMembers",
    collection: Meteor.users,
    columns: [{
        data: "profile.first_name",
        title: "Vorname"
    }, {
        data: "profile.last_name",
        title: "Nachname"
    }, {
        data: "profile.mobileNat",
        title: "Telefon"
    }, {
        data: "emails.0.address",
        title: "E-Mail"
    }, /*{
        data: "banned",
        title: "Gesperrt",
        render: function (val, type, doc) {
            if (val) {
                return "Gesperrt";
            } else {
                return "";
            }
        }
    }*/
    {
        data: "profile.zip",
        title: "PLZ"
    },
        //{
        //-    tmpl: Meteor.isClient && Template.applicantsOptions
        //}
    ],
    allow: function (userId) {
        // Wir holen uns einen Cursor auf alle Group-Objekte, in denen wir als Coordinator eingetragen sind
        var coordinatingGroupsCursor = Groups.find({
            coordinators: {
                $in: [userId]
            }
        }, {
            sort:
            {
                "_id": 1
            }
        });
        /**
         * Wir wandeln den Cursor in einen Array von Group-Objekten um.
         * Die Array-Elemente haben das Format: {"_id": "oASvwiu33872r827..."}
         * @type {Array}
         */
        var coordinatingGroups = coordinatingGroupsCursor.fetch();
        /**
         * Bestimmt, ob der User in irgendeiner Gruppe ein Koordinator ist.
         * @type {boolean}
         */
        var isCoordinatorInAnyGroup = coordinatingGroupsCursor.count() > 0;
        return Roles.userIsInRole(userId, ["admin"]) || isCoordinatorInAnyGroup; // Zugriffsberechtigung nur für Administratoren
    },
    selector: function (userId) {
        // Wir holen uns einen Cursor auf alle Group-Objekte, in denen wir als Coordinator eingetragen sind
        var coordinatingGroupsCursor = Groups.find({
            coordinators: {
                $in: [userId]
            }
        }, {
            sort:
            {
                "_id": 1
            }
        });
        /**
         * Wir wandeln den Cursor in einen Array von Group-Objekten um.
         * Die Array-Elemente haben das Format: {"_id": "oASvwiu33872r827..."}
         * @type {Array}
         */
        var coordinatingGroups = coordinatingGroupsCursor.fetch();
        /**
         * Wir bauen aus den Gruppen-Objekten einen Array aus IDs.
         * Entsprechen den IDs der Gruppen, deren Koordinator man ist.
         * Der Array wird das Format haben: arrayOfIds = ["FaF93h92pßvli286f28vv", "297ghb2pßvli286f28vv", ...]
         * @type {Array}
         */
        var arrayOfIds = [];
        // Mit einer Foreach-Schleife das Objekt-Array coordinatingGroups umwandeln in arrayOfIds.
        _.forEach(coordinatingGroups, function (group) {
            arrayOfIds.push(group._id);
        });
        return {
            "groups": {
                $in: arrayOfIds
            }
        };
    },
    "autoWidth": false
});


TabularTables["Assignments"] = new Tabular.Table({
    name: "Assignments",
    collection: Assignments,
    columns: [{
        data: "name",
        title: "Name"
    },
    {
        data: "start",
        title: "Termin",
        render: function (val, type, doc) {
            if (val instanceof Date) {
                return moment(val).format("L LT");
            } else {
                return "";
            }
        },
    },
    {
        data: "applicants.length",
        title: "Bew.",
        orderable: false
    },
    {
        data: "participants.length",
        title: "Teiln.",
        orderable: false
    },

    {
        data: "state",
        title: "Zustand",
        orderable: false,
        render: function (val, type, doc) {
            if (val == "Hidden") {
                return "Versteckt";
            } else {
                return val;
            }
        }

    },
    {
        tmpl: Meteor.isClient && Template["assignmentOptions"]
    }
    ],
    "order": [[1, 'desc']], // Nach Start-Datum sortieren
    extraFields: ['end', "pickup_point", "return_point", "note", "userGoal", "contacts"],
    allow: function (userId) {
        // Wir holen uns einen Cursor auf alle Group-Objekte, in denen wir als Coordinator eingetragen sind
        var coordinatingGroupsCursor = Groups.find({
            coordinators: {
                $in: [userId]
            }
        }, {
            sort:
            {
                "_id": 1
            }
        });
        /**
         * Wir wandeln den Cursor in einen Array von Group-Objekten um.
         * Die Array-Elemente haben das Format: {"_id": "oASvwiu33872r827..."}
         * @type {Array}
         */
        var coordinatingGroups = coordinatingGroupsCursor.fetch();
        /**
         * Bestimmt, ob der User in irgendeiner Gruppe ein Koordinator ist.
         * @type {boolean}
         */
        var isCoordinatorInAnyGroup = coordinatingGroupsCursor.count() > 0;
        return Roles.userIsInRole(userId, ["admin"]) || isCoordinatorInAnyGroup; // Zugriffsberechtigung nur für Administratoren
    },
    selector: function (userId) {
        // Wir holen uns einen Cursor auf alle Group-Objekte, in denen wir als Coordinator eingetragen sind
        var coordinatingGroupsCursor = Groups.find({
            coordinators: {
                $in: [userId]
            }
        }, {
            sort:
            {
                "_id": 1
            }
        });
        /**
         * Wir wandeln den Cursor in einen Array von Group-Objekten um.
         * Die Array-Elemente haben das Format: {"_id": "oASvwiu33872r827..."}
         * @type {Array}
         */
        var coordinatingGroups = coordinatingGroupsCursor.fetch();
        /**
         * Wir bauen aus den Gruppen-Objekten einen Array aus IDs.
         * Entsprechen den IDs der Gruppen, deren Koordinator man ist.
         * Der Array wird das Format haben: arrayOfIds = ["FaF93h92pßvli286f28vv", "297ghb2pßvli286f28vv", ...]
         * @type {Array}
         */
        var arrayOfIds = [];
        // Mit einer Foreach-Schleife das Objekt-Array coordinatingGroups umwandeln in arrayOfIds.
        _.forEach(coordinatingGroups, function (group) {
            arrayOfIds.push(group._id);
        });
        return {
            "group": {
                $in: arrayOfIds
            },
            "start": {
                $gte: moment().subtract(1, 'month').toDate() // Alles anzeigen, was einen Monat alt oder neuer ist.
            }
        };
    },
    "autoWidth": false,
    createdRow: function (row, data, dataIndex) {
        // @ts-ignore
        var id = ManageAssignments.getSelectedAssignmentId(FlowRouter.getParam("groupId"));

        if (id == data._id) {
            $(row).addClass('active');
        }
    }
});

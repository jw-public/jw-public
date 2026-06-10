import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import { Roles } from "meteor/alanning:roles";
import * as _ from "underscore";

import * as EmailSettingsManager from "./EmailSettingsManager";
import { initData } from "./InitialData";

import * as moment from "moment";
require('moment/locale/de');

// Erstellt User, wenn keine im System vorhanden sind. Dies ist vorallem für Tests notwendig.
Meteor.startup(function () {
    // alanning:roles v4 stores assignments in Meteor.roleAssignment.
    // Migrate legacy user.roles arrays once.
    (Promise as any).await(Roles.createRoleAsync("admin", { unlessExists: true }));
    Meteor.users.find({ roles: { $exists: true } }).forEach(function (user: any) {
        if (Array.isArray(user.roles) && user.roles.length > 0) {
            user.roles.forEach(function (r: string) { (Promise as any).await(Roles.createRoleAsync(r, { unlessExists: true })); });
            (Promise as any).await(Roles.addUsersToRolesAsync(user._id, user.roles));
        }
        Meteor.users.update(user._id, { $unset: { roles: "" } });
    });

    // Validate username, without a specific error message.
    Accounts.validateNewUser(function (user) { // Wir lehnen einen User ohne Gruppenbewerbung ab
        return user.username === "root" || (!_.isUndefined(user.profile.pendingGroups) && user.profile.pendingGroups.length > 0);
    });

    if (Meteor.users.find().count() === 0) {
        initData();
    }
    EmailSettingsManager.initEmailSettings();
    moment.locale("de"); // moment.js auf Deutsch stellen
    console.log("MOMENT LOCALES IS " + moment.locale());
    console.log("Meteor started up.");
});

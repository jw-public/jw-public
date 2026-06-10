import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import { Roles } from "meteor/alanning:roles";
import * as _ from "underscore";

import * as EmailSettingsManager from "./EmailSettingsManager";
import { initData } from "./InitialData";

import * as moment from "moment";
require('moment/locale/de');

// Erstellt User, wenn keine im System vorhanden sind. Dies ist vorallem für Tests notwendig.
Meteor.startup(async function () {
    // alanning:roles v4 stores assignments in Meteor.roleAssignment.
    // Migrate legacy user.roles arrays once.
    await Roles.createRoleAsync("admin", { unlessExists: true });
    const legacyUsers = await Meteor.users.find({ roles: { $exists: true } }).fetchAsync();
    for (const user of legacyUsers as any[]) {
        if (Array.isArray(user.roles) && user.roles.length > 0) {
            for (const r of user.roles) {
                await Roles.createRoleAsync(r, { unlessExists: true });
            }
            await Roles.addUsersToRolesAsync(user._id, user.roles);
        }
        await Meteor.users.updateAsync(user._id, { $unset: { roles: "" } });
    }

    // Validate username, without a specific error message.
    Accounts.validateNewUser(function (user) { // Wir lehnen einen User ohne Gruppenbewerbung ab
        return user.username === "root" || (!_.isUndefined(user.profile.pendingGroups) && user.profile.pendingGroups.length > 0);
    });

    if (await Meteor.users.find().countAsync() === 0) {
        await initData();
    }
    EmailSettingsManager.initEmailSettings();
    moment.locale("de"); // moment.js auf Deutsch stellen
    console.log("MOMENT LOCALES IS " + moment.locale());
    console.log("Meteor started up.");
});

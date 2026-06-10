import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import { Roles } from "meteor/alanning:roles";
import * as _ from "underscore";

import * as EmailSettingsManager from "./EmailSettingsManager";
import { initData } from "./InitialData";

import moment from "moment";
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
    Accounts.validateNewUser(async function (user: any) { // Wir lehnen einen User ohne Gruppenbewerbung ab
        if (user.username === "root") {
            return true;
        }
        const pendingGroups: string[] = (user.profile && user.profile.pendingGroups) || [];
        if (pendingGroups.length === 0) {
            return false;
        }
        // Referential safety: every applied-for group must exist (used to be a
        // SimpleSchema custom validator, which cannot be async on Meteor 3).
        const { Groups } = require("../collections/lib/GroupCollection");
        for (const groupId of pendingGroups) {
            const exists = await Groups.find({ _id: groupId }, { fields: { _id: 1 } }).countAsync();
            if (!exists) {
                return false;
            }
        }
        return true;
    });

    if (await Meteor.users.find().countAsync() === 0) {
        await initData();
    }
    EmailSettingsManager.initEmailSettings();
    moment.locale("de"); // moment.js auf Deutsch stellen
    console.log("MOMENT LOCALES IS " + moment.locale());
    console.log("Meteor started up.");
});

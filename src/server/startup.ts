import * as _ from "underscore";
import { Meteor, Subscription } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";

import * as EmailSettingsManager from "./EmailSettingsManager";
import { initData } from "./InitialData";

import * as moment from "moment";
require('moment/locale/de');

// Erstellt User, wenn keine im System vorhanden sind. Dies ist vorallem für Tests notwendig.
Meteor.startup(function () {
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

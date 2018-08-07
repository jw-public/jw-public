import {Meteor, Subscription} from "meteor/meteor";
import {Template} from "meteor/templating";
import {Mongo} from "meteor/mongo";
import {Accounts} from "meteor/accounts-base";
import {Roles} from "meteor/alanning:roles";

import * as EmailSettingsManager from "./EmailSettingsManager";


// Erstellt User, wenn keine im System vorhanden sind. Dies ist vorallem für Tests notwendig.
Meteor.startup(function() {
    // Validate username, without a specific error message.
    Accounts.validateNewUser(function (user) { // Wir lehnen einen User ohne Gruppenbewerbung ab
        return user.username === "root" || (!_.isUndefined(user.profile.pendingGroups) && user.profile.pendingGroups.length > 0);
    });

    if (Meteor.users.find().count() === 0) {
        let users = [{
            vorname: "Admin",
            nachname: "User",
            gender: "Male",
            email: "admin@trolley.com",
            roles: ["admin"],
            password: "admin3210"
        }];
        _.each(users, function(user) {
            let id = Accounts.createUser({
                username: "root",
                email: user.email,
                password: user.password,
                profile: {
                    first_name: user.vorname,
                    last_name: user.nachname,
                    gender: user.gender,
                    mobile: "08122 894327",
                    zip: "85435",
                    placeName: "Erding"
                }
            });
            if (user.roles.length > 0) {
                Roles.addUsersToRoles([id], user.roles);
            }
            console.log("Added new user: ", user.email);
        });
    }
    EmailSettingsManager.initEmailSettings();
    console.log("Meteor started up.");
});

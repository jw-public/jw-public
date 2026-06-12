import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import { Roles } from "meteor/alanning:roles";

import { TERMS_OF_USE_VERSION } from "../imports/terms/TermsOfUse";
import * as EmailSettingsManager from "./EmailSettingsManager";
import { initData } from "./InitialData";

import moment from "moment";
require("moment/locale/de");

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

  // Die Zustimmung zu den Nutzungsbedingungen reist als Custom-Option in
  // Accounts.createUser mit und wird hier serverseitig gestempelt — der
  // Client kann das Feld selbst nie schreiben (Allow-Rule erlaubt nur
  // profile/updatedAt).
  Accounts.onCreateUser(function (options: any, user: any) {
    if (options.profile) {
      user.profile = options.profile;
    }
    if (options.termsOfUseAccepted === TERMS_OF_USE_VERSION) {
      user.termsOfUse = {
        version: TERMS_OF_USE_VERSION,
        acceptedAt: new Date(),
      };
    }
    return user;
  });

  // Validate username, without a specific error message.
  Accounts.validateNewUser(async function (user: any) {
    // Wir lehnen einen User ohne Gruppenbewerbung ab
    if (user.username === "root") {
      return true;
    }
    // Ohne aktive Zustimmung zu den Nutzungsbedingungen keine Registrierung.
    if (!user.termsOfUse || user.termsOfUse.version !== TERMS_OF_USE_VERSION) {
      return false;
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

  if ((await Meteor.users.find().countAsync()) === 0) {
    await initData();
  }
  EmailSettingsManager.initEmailSettings();
  moment.locale("de"); // moment.js auf Deutsch stellen
  console.log("MOMENT LOCALES IS " + moment.locale());
  console.log("Meteor started up.");
});

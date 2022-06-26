import { Meteor } from "meteor/meteor";

export const CONTEXT_NAME_STEP_TWO = "register-secondStep-register";

import * as UserCollection from "./UserCollection";
import { UserProfileSchema } from "./Users";


/**
 * Wird verwendet, wenn ein neuer Benutzer angelegt werden soll.
 * Dieses Objekt wird als Parameter dann Accounts.createUser() aufgerufen.
 * @type {SimpleSchema}
 */
export const NewUserSchema = new SimpleSchema({
  email: {
    type: String,
    label: "E-Mail",
    trim: true,
    // this must be optional if you also use other login services like facebook,
    // but if you use only accounts-password, then it can be required
    optional: false,
    custom: function () {
      // Überprüft, ob der Nutzer schon im System ist und gibt ggf. eine Fehlermeldung aus.
      if (Meteor.isClient && this.isSet) {
        Meteor.call("userExists", this.value, function (error, result) {
          if (result) {
            getStepTwoContext().addInvalidKeys([{
              name: "email",
              type: "userAlreadyExisting"
            }]);
          }
        });
      }
    },
    autoValue: function () {
      if (this.isSet) {
        return this.value.trim().toLowerCase(); // Alles kleinschreiben
      }
    }
  },
  password: {
    type: String,
    label: "Passwort",

    // this must be optional if you also use other login services like facebook,
    // but if you use only accounts-password, then it can be required
    optional: false,
    min: 6
  },
  passwordConfirmation: {
    type: String,
    label: "Passwort bestätigen",
    custom: function () {
      if (this.value !== this.field('password').value) {
        return "passwordMissmatch";
      }
    }
  },
  profile: {
    type: UserProfileSchema,
    optional: false
  }
});

export interface INewUser {
  email: string;
  password: string;
  passwordConfirmation: string;
  profile: UserCollection.UserProfile;
}

export function getStepTwoContext() {
  return NewUserSchema.namedContext(CONTEXT_NAME_STEP_TWO);
}

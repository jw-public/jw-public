import * as _ from "underscore";
import { SUPPORTED_LANGUAGES } from '../../imports/i18n/classes/I18nProvider';
import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

import Group from "./classes/Group";

import * as Registration from './Registration';
import * as ProfileEdit from './ProfileEdit';

import { CollectionConf } from "./collectionConfig/CollectionConf";


import * as PhoneValidator from './ValidationFunctions/PhoneValidator';
import * as ServerMethodsWrapper from '../../lib/classes/ServerMethodsWrapper';

export const UserProfileSchema = new SimpleSchema({
  first_name: {
    type: String,
    label: "Vorname"
  },
  last_name: {
    type: String,
    label: "Nachname"
  },
  gender: {
    type: String,
    label: "Geschlecht",
    allowedValues: ['Male', 'Female']
  },
  language: {
    type: String,
    label: "Sprache",
    allowedValues: SUPPORTED_LANGUAGES,
    defaultValue: "de-de"
  },
  carMostlyAvailable: {
    type: Boolean,
    label: "Auto meistens verfügbar",
    optional: true
  },
  pioneer: {
    type: Boolean,
    label: "Ich bin ein Pionier",
    optional: true
  },
  mobile: {
    type: String,
    label: "Handynummer",
    optional: true,
    custom: function () {
      var context = <CustomValidatorContext>this;

      if (!CollectionConf.IS_TEST && !(context.isSet && context.value)) { // Damit bei Dummy Usern keine Fehler entstehen
        return "required";
      } else {
        if (context.isSet && !_.isUndefined(context.value)) {
          var rawNumber: string = context.value;
          if (Meteor.isServer) {
            // Synchrone Validierung
            if (!PhoneValidator.isValidNumber(rawNumber)) {
              return "phoneNumberInvalid";
            }
          } else {
            ServerMethodsWrapper.Validator.validatePhoneNumber(rawNumber, function (err, isValid) {
              if (err) {
                console.error(err);
              }

              if (!isValid) {
                // Alle Formulare, die die Telefonnummer beinhalten benachrichtigen
                Registration.getStepTwoContext().addInvalidKeys([{
                  name: "profile.mobile",
                  type: "phoneNumberInvalid"
                }]);
                ProfileEdit.getValidationContext().addInvalidKeys([{
                  name: "profile.mobile",
                  type: "phoneNumberInvalid"
                }]);
              }
            });
          }
        }
      }
    },
  },
  mobileE164: {
    type: String,
    label: "Formatierte Handynummer",
    optional: true,
    custom: function () {
      var context = <CustomValidatorContext>this;

      if (Meteor.isServer && !CollectionConf.IS_TEST && !(context.isSet && context.value)) {
        return "required";
      }
    },
    autoValue: function (): string {
      if (!Meteor.isServer) {
        return;
      }

      var context = <CustomValidatorContext>this;
      var mobileField = context.siblingField("mobile");

      if (mobileField.isSet) {
        var util = LibPhoneNumber.phoneUtil;
        var phoneNumberRaw = <string>mobileField.value;
        var parsedNumber = util.parse(phoneNumberRaw, "DE");

        if (util.isValidNumber(parsedNumber)) {
          return util.format(parsedNumber, LibPhoneNumber.PhoneNumberFormat.E164);
        } else {
          this.unset();
        }
      } else {
        this.unset();
      }
    }
  },
  mobileNat: {
    type: String,
    label: "Formatierte Handynummer",
    optional: true,
    custom: function () {
      var context = <CustomValidatorContext>this;

      if (Meteor.isServer && !CollectionConf.IS_TEST && !(context.isSet && context.value)) {
        return "required";
      }
    },
    autoValue: function (): string {
      if (!Meteor.isServer) {
        return;
      }

      var context = <CustomValidatorContext>this;
      var mobileField = context.siblingField("mobile");

      if (mobileField.isSet) {
        var util = LibPhoneNumber.phoneUtil;
        var phoneNumberRaw = <string>mobileField.value;
        var parsedNumber = util.parse(phoneNumberRaw, "DE");

        if (util.isValidNumber(parsedNumber)) {
          return util.format(parsedNumber, LibPhoneNumber.PhoneNumberFormat.NATIONAL);
        } else {
          this.unset();
        }
      } else {
        this.unset();
      }
    }
  },
  notificationAsEmail: {
    type: Boolean,
    label: "Benachrichtigungen via E-Mail bekommen",
    optional: true
  },
  pendingGroups: {
    type: [String],
    label: "Ausstehende Gruppenbewerbungen",
    optional: true
  },
  "pendingGroups.$": {
    type: String, // TODO: Zeitstempel integrieren, damit man sehen kann, wie alt eine Bewerbung ist.
    regEx: SimpleSchema.RegEx.Id,
    custom: function () { // Sicherheitsüberprüfung, sodass keine ungültigen IDs referenziert werden.
      if (Meteor.isServer && !CollectionConf.IS_TEST && this.isSet) {
        var context = <CustomValidatorContext>this;
        var groupExists = Group.groupExists(context.value);

        if (!groupExists) {
          return "groupIdNotValid";
        }
      }
    }
  },

  zip: {
    type: String,
    optional: true,
    trim: true,
    label: "Postleitzahl",
    regEx: /^[0-9]{4,5}$/,
    custom: function () {
      var context = <CustomValidatorContext>this;

      var shouldBeRequired: boolean = context.isInsert;

      if (shouldBeRequired) {
        // inserts
        if (!context.operator) {
          if (!context.isSet || context.value === null || context.value === "") return "required";
        }

        // updates
        else if (context.isSet) {
          if (context.operator === "$set" && context.value === null || context.value === "") return "required";
          if (context.operator === "$unset") return "required";
          if (context.operator === "$rename") return "required";
        }
      }
    }
  },
  placeName: {
    type: String,
    optional: true,
    trim: true,
    label: "Wohnort",
    custom: function () {
      var context = <CustomValidatorContext>this;

      var shouldBeRequired: boolean = context.isInsert;

      if (shouldBeRequired) {
        // inserts
        if (!context.operator) {
          if (!context.isSet || context.value === null || context.value === "") return "required";
        }

        // updates
        else if (context.isSet) {
          if (context.operator === "$set" && context.value === null || context.value === "") return "required";
          if (context.operator === "$unset") return "required";
          if (context.operator === "$rename") return "required";
        }
      }
    }
  }
});



export const UserSchema = new SimpleSchema({
  username: {
    type: String,
    regEx: /^[a-z0-9A-Z_]{3,15}$/,
    optional: true
  },
  emails: {
    type: [Object],
    label: "E-Mail",
    // this must be optional if you also use other login services like facebook,
    // but if you use only accounts-password, then it can be required
    optional: true
  },
  "emails.$.address": {
    type: String,
    label: "Adresse",
    regEx: SimpleSchema.RegEx.Email,
    trim: true,
    autoValue: function () {
      if (this.isSet) {
        return this.value.trim().toLowerCase(); // Alles kleinschreiben
      }
    }
  },
  "emails.$.verified": {
    type: Boolean,
    label: "E-Mail-Adresse ist verifiziert"
  },
  profile: {
    type: UserProfileSchema,
    optional: true
  },
  services: {
    type: Object,
    optional: true,
    blackbox: true
  },
  roles: {
    type: [String],
    label: "Rollen",
    optional: true
  },
  "roles.$": {
    type: String
  },
  groups: {
    type: [String],
    label: "Gruppen",
    defaultValue: [],
    index: 1
  },
  "groups.$": {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    custom: function () { // Sicherheitsüberprüfung, sodass keine ungültigen IDs referenziert werden.
      if (Meteor.isServer && !CollectionConf.IS_TEST && this.isSet) {
        var context = <CustomValidatorContext>this;
        var groupExists = Group.groupExists(context.value);

        if (!groupExists) {
          return "groupIdNotValid";
        }
      }
    }
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
        return;
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
  banned: {
    type: Boolean,
    label: "Gesperrt",
    optional: true,
    defaultValue: false
  },
  notice: {
    type: String,
    label: "Notiz",
    optional: true
  }
});


Meteor.users.attachSchema(UserSchema);



/**
 * Wird verwendet, wenn eine E-Mail Adresse validiert werden soll.
 * @type {SimpleSchema}
 */
export const JustEmail = new SimpleSchema({
  email: {
    type: String,
    label: "E-Mail",
    optional: false,
    trim: true,
    regEx: SimpleSchema.RegEx.Email,
    autoValue: function () {
      if (this.isSet) {
        return this.value.toLowerCase(); // Alles kleinschreiben
      }
    }
  }
});

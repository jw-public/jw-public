import * as LibPhoneNumber from "../../lib/LibPhoneNumber";
import { Meteor } from "meteor/meteor";
import SimpleSchema, { SchemaContext } from "./SimpleSchema";
import * as _ from "underscore";
import { SUPPORTED_LANGUAGES } from "../../imports/i18n/classes/I18nProvider";

import * as ProfileEdit from "./ProfileEdit";
import * as Registration from "./Registration";

import { CollectionConf } from "./collectionConfig/CollectionConf";

import * as ServerMethodsWrapper from "../../lib/classes/ServerMethodsWrapper";
import * as PhoneValidator from "./ValidationFunctions/PhoneValidator";

export const UserProfileSchema = new SimpleSchema({
  first_name: {
    type: String,
    label: "Vorname",
  },
  last_name: {
    type: String,
    label: "Nachname",
  },
  gender: {
    type: String,
    label: "Geschlecht",
    allowedValues: ["Male", "Female"],
  },
  language: {
    type: String,
    label: "Sprache",
    allowedValues: SUPPORTED_LANGUAGES,
    defaultValue: "de-de",
  },
  carMostlyAvailable: {
    type: Boolean,
    label: "Auto meistens verfügbar",
    optional: true,
  },
  pioneer: {
    type: Boolean,
    label: "Ich bin ein Pionier",
    optional: true,
  },
  mobile: {
    type: String,
    label: "Handynummer",
    optional: true,
    custom: function (this: SchemaContext) {
      var context = <any>this;

      if (!CollectionConf.IS_TEST && !(context.isSet && context.value)) {
        // Damit bei Dummy Usern keine Fehler entstehen
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
            void ServerMethodsWrapper.Validator.validatePhoneNumber(rawNumber)
              .catch((err) => {
                console.error(err);
                return false;
              })
              .then(function (isValid) {
                if (!isValid) {
                  // Alle Formulare, die die Telefonnummer beinhalten benachrichtigen
                  Registration.getStepTwoContext().addValidationErrors([
                    {
                      name: "profile.mobile",
                      type: "phoneNumberInvalid",
                    },
                  ]);
                  ProfileEdit.getValidationContext().addValidationErrors([
                    {
                      name: "profile.mobile",
                      type: "phoneNumberInvalid",
                    },
                  ]);
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
    custom: function (this: SchemaContext) {
      var context = <any>this;

      if (Meteor.isServer && !CollectionConf.IS_TEST && !(context.isSet && context.value)) {
        return "required";
      }
    },
    autoValue: function (this: SchemaContext): string | undefined {
      if (!Meteor.isServer) {
        return;
      }

      var context = <any>this;
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
    },
  },
  mobileNat: {
    type: String,
    label: "Formatierte Handynummer",
    optional: true,
    custom: function (this: SchemaContext) {
      var context = <any>this;

      if (Meteor.isServer && !CollectionConf.IS_TEST && !(context.isSet && context.value)) {
        return "required";
      }
    },
    autoValue: function (this: SchemaContext): string | undefined {
      if (!Meteor.isServer) {
        return;
      }

      var context = <any>this;
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
    },
  },
  notificationAsEmail: {
    type: Boolean,
    label: "Benachrichtigungen via E-Mail bekommen",
    optional: true,
  },
  pendingGroups: {
    type: Array,
    label: "Ausstehende Gruppenbewerbungen",
    optional: true,
  },
  "pendingGroups.$": {
    type: String, // TODO: Zeitstempel integrieren, damit man sehen kann, wie alt eine Bewerbung ist.
    regEx: SimpleSchema.RegEx.Id,
    // Referential safety (group must exist) lives in Accounts.validateNewUser
    // (server/startup.ts): SimpleSchema custom validators are synchronous and
    // Meteor 3's server Mongo API is async-only.
  },

  zip: {
    type: String,
    optional: true,
    label: "Postleitzahl",
    regEx: /^[0-9]{4,5}$/,
    custom: function (this: SchemaContext) {
      var context = <any>this;

      var shouldBeRequired: boolean = context.isInsert;

      if (shouldBeRequired) {
        // inserts
        if (!context.operator) {
          if (!context.isSet || context.value === null || context.value === "") return "required";
        }

        // updates
        else if (context.isSet) {
          if ((context.operator === "$set" && context.value === null) || context.value === "")
            return "required";
          if (context.operator === "$unset") return "required";
          if (context.operator === "$rename") return "required";
        }
      }
    },
  },
  placeName: {
    type: String,
    optional: true,
    label: "Wohnort",
    custom: function (this: SchemaContext) {
      var context = <any>this;

      var shouldBeRequired: boolean = context.isInsert;

      if (shouldBeRequired) {
        // inserts
        if (!context.operator) {
          if (!context.isSet || context.value === null || context.value === "") return "required";
        }

        // updates
        else if (context.isSet) {
          if ((context.operator === "$set" && context.value === null) || context.value === "")
            return "required";
          if (context.operator === "$unset") return "required";
          if (context.operator === "$rename") return "required";
        }
      }
    },
  },
});

export const UserSchema = new SimpleSchema({
  username: {
    type: String,
    regEx: /^[a-z0-9A-Z_]{3,15}$/,
    optional: true,
  },
  emails: {
    type: Array,
    label: "E-Mail",
    // this must be optional if you also use other login services like facebook,
    // but if you use only accounts-password, then it can be required
    optional: true,
  },
  "emails.$": {
    type: Object,
  },
  "emails.$.address": {
    type: String,
    label: "Adresse",
    regEx: SimpleSchema.RegEx.Email,
    autoValue: function (this: SchemaContext) {
      if (this.isSet) {
        return this.value.trim().toLowerCase(); // Alles kleinschreiben
      }
    },
  },
  "emails.$.verified": {
    type: Boolean,
    label: "E-Mail-Adresse ist verifiziert",
  },
  profile: {
    type: UserProfileSchema,
    optional: true,
  },
  services: {
    type: Object,
    optional: true,
    blackbox: true,
  },
  roles: {
    type: Array,
    label: "Rollen",
    optional: true,
  },
  "roles.$": {
    type: String,
  },
  groups: {
    type: Array,
    label: "Gruppen",
    defaultValue: [],
  },
  "groups.$": {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    // Referential safety (group must exist) is enforced where groups are
    // granted (methods.ts addToGroup loads the group first): SimpleSchema
    // custom validators are synchronous and Meteor 3's server Mongo API is
    // async-only.
  },
  // Force value to be current date (on server) upon insert
  // and prevent updates thereafter.
  createdAt: {
    type: Date,
    autoValue: function (this: SchemaContext): any {
      if (this.isInsert) {
        return new Date();
      } else if (this.isUpsert) {
        return { $setOnInsert: new Date() };
      } else {
        this.unset();
        return;
      }
    },
  },
  // Force value to be current date (on server) upon update
  // and don't allow it to be set upon insert.
  updatedAt: {
    type: Date,
    autoValue: function (this: SchemaContext) {
      if (this.isUpdate) {
        return new Date();
      }
    },
    optional: true,
  },
  banned: {
    type: Boolean,
    label: "Gesperrt",
    optional: true,
    defaultValue: false,
  },
  notice: {
    type: String,
    label: "Notiz",
    optional: true,
  },
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
    regEx: SimpleSchema.RegEx.Email,
    autoValue: function (this: SchemaContext) {
      if (this.isSet) {
        return this.value.toLowerCase(); // Alles kleinschreiben
      }
    },
  },
});

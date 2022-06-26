import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Locale } from '../../imports/i18n/classes/I18nProvider';

import * as ProfileEdit from '../../collections/lib/ProfileEdit';

import { AutoForm } from "meteor/aldeed:autoform";


interface LanguageOption {
    value: Locale,
    label: string
}

/**
 * Wird verwendet, wenn ein Benutzer das Kennwort ändert.
 * @type {SimpleSchema}
 */
const ChangePwd = new SimpleSchema({
    oldpassword: {
        type: String,
        label: "Altes Passwort",
        optional: false,
        min: 6
    },
    password: {
        type: String,
        label: "Passwort",
        optional: false,
        min: 6
    },
    passwordConfirmation: {
        type: String,
        label: "Passwort bestätigen",
        custom() {
            if ((<any>this).value !== (<any>this).field('password').value) {
                return "passwordMissmatch";
            }
        }
    }
});

/************************************************************
 * Template: modifyProfile
 *
 * Beschreibung der Logik für das Template, das die Verwaltung
 * des eigenen Profils des angemeldeten Users ermöglicht.
 ************************************************************/
// Mapping von Datenbank-Einträgen auf UI-Variablen.
Template["modifyProfile"].helpers({
    firstName() { // Vorname
        return Meteor.user().profile.first_name;
    },
    lastName() { // Nachname
        return Meteor.user().profile.last_name;
    },
    currentUser() {
        return Meteor.user();
    },
    genderOption() {
        return [{
            label: "ein Bruder",
            value: "Male"
        }, {
            label: "eine Schwester",
            value: "Female"
        }];
    },
    languageOption(): Array<LanguageOption> {
        return [{
            value: "de-de",
            label: "Deutsch"
        }, {
            value: "en-en",
            label: "Englisch"
        }, {
            value: "fr-fr",
            label: "Französisch"
        }];
    },
    formId(): string {
        return ProfileEdit.FORM_ID;
    },
    passwordSchema() {
        return ChangePwd;
    }
});

/**
 * Hier bestimmen wir das Verhalten der Formulare.
 */
AutoForm.hooks({
    "profileChangePassword": { // Die ID des Formulars
        onSubmit: function (doc) {
            // Sicherstellen, dass die eingebenen Daten dem Schema entsprechen
            ChangePwd.clean(doc);
            // Das Abschicken des Formulars verhindern.
            this.event.preventDefault();
            console.log(doc);

            var _this = this; // So kann in der folgenden Funktion auf this zugegriffen werden

            Accounts.changePassword(doc["oldpassword"], doc["password"], function (err) {
                if (err) {
                    console.log("Fehler: ", err);
                    var errorMessage;
                    if (err.reason == "Incorrect password") {
                        errorMessage = "Kennwort konnte nicht geändert werden: Das alte Passwort ist falsch."
                    } else {
                        errorMessage = "Ein Fehler ist aufgetreten: " + err.message;
                    }
                    Alerts.add(errorMessage, 'danger', {
                        fadeIn: 100, fadeOut: 100, autoHide: 5000
                    });
                    console.log('Es tut uns Leid, dein altes Kennwort ist falsch!');
                    _this.done(err);
                } else {
                    Alerts.removeSeen();
                    Alerts.add('Dein Kennwort wurde erfolgreich geändert.', 'success',
                        {
                            fadeIn: 100, fadeOut: 100, autoHide: 3000
                        });
                    console.log('Dein Kennwort wurde geändert!');
                    // AutoForm anzeigen, dass wir soweit keinen Fehler festgestellt haben. Ansonsten müssten wir ein Error-
                    // ... - Objekt übergeben
                    _this.done();
                }
                return false;
            });
        }
    }
});

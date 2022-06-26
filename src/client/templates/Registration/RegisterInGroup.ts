import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import { Session } from "meteor/session";
import { Template } from "meteor/templating";

import { Groups } from "../../../collections/lib/GroupCollection";


import * as Registration from "../../../collections/lib/Registration";

import { JustEmail } from "../../../collections/lib/Users";

import { AutoForm } from "meteor/aldeed:autoform";
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

Template["RegisterInGroup"].helpers({
  genderOption: function () {
    return [
      { label: "ein Bruder", value: "Male" },
      { label: "eine Schwester", value: "Female" }
    ];
  },
  groupName: function () {
    return Groups.findOne({ "_id": FlowRouter.getParam("groupId") }).name; // Wir bekommen die Daten aus dem Subscribe in routes.js
  },

  /**
   * Überpruft, ob man sich im gegeben Schritt der Registration befindet.
   * @param step  Der zu prüfende Schritt.
   * @returns {boolean} step stimmt mit dem aktuellen Schritt überein
   */
  isStep: function (step) {

    // Falls die Session-Variable noch nicht initialisiert wurde, wird sie auf 1 gesetzt
    if (!Session.get("currentStep")) {
      Session.set("currentStep", 1);
    }

    return Session.get("currentStep") === step;
  },

  lastInsertedData: function () {
    return Session.get("lastInsertedData");
  },
  formId: function (): string {
    return Registration.CONTEXT_NAME_STEP_TWO;
  },
  emailSchema() {
    return JustEmail;
  },
  registrationSchema() {
    return Registration.NewUserSchema;
  }
});

Template["RegisterInGroup"].events({
  "click #backToStart": function () {
    Session.set("currentStep", 1); // Wir gehen zurück zu Schritt 1
    AutoForm.resetForm(Registration.CONTEXT_NAME_STEP_TWO);
  }
});




/**
 * Findet heraus, ob die gegebene E-Mail Adresse bereits im System registriert ist.
 * Wenn diese bereits vorhanden ist, soll sich der User anmelden, um die Gruppenbewerbung abzuschließen.
 * Andernfalls soll sich der User Anmelden.
 * @param given_email Die gegebene Adresse.
 */
function registerStepTwo(given_email) {
  // Über einen Aufruf einer Servermethode ("/server/methods.js") finden wir heraus, ober der User existiert
  Meteor.call('userExists', given_email, function (err, userExists) {

    if (userExists) {
      console.log("Benutzer ist bereits registriert!");
      //TODO: Registrierung für bereits angemeldete Nutzer
      alert("Du bist bereits schon im System registriert. Eine zweite Registrierung ist zurzeit nicht möglich.")
    } else {
      console.log("Benutzer ist neu! Weiter gehts.");
      // Danach in der Session-Variable anzeigen, dass wir im Schritt 2 sind
      Session.set("currentStep", 2);
    }

  });
}


/**
 * Hier bestimmen wir das Verhalten der Formulare.
 */
AutoForm.hooks({
  "register-firstStep-email": { // Die ID des Formulars in Schritt 1
    onSubmit: function (doc: any) {
      // Sicherstellen, dass die eingebenen Daten dem Schema entsprechen
      JustEmail.clean(doc);

      // Das Abschicken des Formulars verhindern.
      this.event.preventDefault();

      console.log(doc);

      Session.set("lastInsertedData", doc);

      // AutoForm anzeigen, dass wir soweit keinen Fehler festgestellt haben. Ansonsten müssten wir ein Error-
      // ... - Objekt übergeben
      this.done();


      // Wenn das Formular fertig versteckt ist:
      // Gehe zum nächsten Schritt in der Registrierung
      registerStepTwo(doc.email);


      return false;
    }
  },
  "register-secondStep-register": { // === Registration.CONTEXT_NAME_STEP_TWO
    onSubmit: function (doc: Registration.INewUser) {
      var self = <AutoForm.HookMethodContext<Registration.INewUser>>this;
      doc.profile.pendingGroups = [FlowRouter.getParam("groupId")];

      // Sicherstellen, dass die eingebenen Daten dem Schema entsprechen
      Registration.NewUserSchema.clean(doc);

      // Das Abschicken des Formulars verhindern.
      self.event.preventDefault();

      console.log(doc);

      Session.set("lastInsertedData", {
        email: doc.email
      });


      Accounts.createUser(doc, function (err) {
        if (err) {
          alert(err.details);
          console.error(err);
          self.done(err);
        } else {
          FlowRouter.go("home");
          Session.set("lastInsertedData", undefined);
          Session.set("currentStep", 1);
          self.done();
        }
      });

      return false;
    }
  }
});

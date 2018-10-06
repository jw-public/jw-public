import * as underscore from "underscore";
import * as s from "underscore.string";

import {Meteor} from "meteor/meteor";
import {Tracker} from "meteor/tracker";
import {Accounts} from "meteor/accounts-base";
import {Template} from "meteor/templating";
import {Routes} from "../../lib/client/routes";

declare var accountsUIBootstrap3:any;

Meteor.startup(function () {


    Accounts.onLogout(function() {
      FlowRouter.go("login"); // Wenn sich ein Benutzer ausgeloggt hat, wollen wir ihn zum Login schicken.
    });


    /*
     * #### Layout initialisieren ####
     */
    BlazeLayout.setRoot('body');
    accountsUIBootstrap3.setLanguage('de'); // for German
    bootbox.setLocale("de");

    Accounts.onLogin(function() {
      if(FlowRouter.getRouteName() === Routes.Def.Login.name) {
        Routes.go(Routes.Def.Home);
      }
    });
});

/*
 * #### Template-Helper für Underscore ####
 */

Template.registerHelper('underscore', function(...args: Array<any>) {
    args = underscore.toArray(args);
    var self = this,
        fn = arguments[0];
    args.shift();
    args.pop();
    return underscore[fn].apply(self, arguments);
});

declare var Spacebars: any;

Template.registerHelper('breaklines', function(text, options) {
  text = s.escapeHTML(text);
  text = text.replace(/(\r\n|\n|\r)/gm, '<br/>');
  return new Spacebars.SafeString(text);
});

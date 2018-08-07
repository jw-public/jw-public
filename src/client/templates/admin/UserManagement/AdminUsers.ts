/************************************************************
 * Template: adminUsers
 *
 * Beschreibung der Logik für das Template, das die Verwaltung
 * von Benutzern im System durch den Admin ermöglicht.
 ************************************************************/

 import {Meteor} from "meteor/meteor";
 import {Template} from "meteor/templating";
 import {Session} from "meteor/session";
 import {Groups, GroupDAO} from "../../../../collections/lib/GroupCollection";
 import {AutoForm} from "meteor/aldeed:autoform";
 import * as ServerMethodsWrapper from "../../../../lib/classes/ServerMethodsWrapper";


 Template["adminUsers"].onCreated(function () {
     let instance = Template.instance();

     instance.subscribe("coordinatingGroups");
     instance.subscribe("roles");
 });

Template["adminUsers"].helpers({
    users: function () {
        return Meteor.users.find();
    },
    roles: function () {
        return Meteor.roles.find();
    },
    isUserSelected: function () {
        return Session.get("user_options_selected_user") != null;
    },
    selectedUser: function () {
        return Session.get("user_options_selected_user");
    },
    genderOption: function () {
        return [{
                label: "Bruder",
                value: "Male"
            }, {
                label: "Schwester",
                value: "Female"
            }];
    },
    groupsOptions: function () {
        return Groups.find({}, {}).map(function (c) {
            return {
                label: (c.name),
                value: c._id
            };
        });
    },
    rolesOptions: function () {
        return Meteor.roles.find({}, {}).map(function (c) {
            return {
                label: (c.name),
                value: (c.name)
            };
        });
    }
});
Template["adminUsers"].onRendered(function () {
    $(".edit-user-panel").hide();
});
Template["adminUsers"].events({
    'click .cancel-update': function () {
      var panel = $(".edit-user-panel"); // Das Panel
        //$(".edit-user-panel").hide();
        panel.hide('slide', {
            direction: 'right',
            easing: "easeInOutCubic"
        }, 400);
    }
});
Template["userOptions"].onCreated(function () {
    Session.set("user_options_selected_user", null);
});
Template["userOptions"].events({
    'click .edit-user': function () {
        // Variablen zur einfacheren Handhabung
        var panel = $(".edit-user-panel"); // Das Panel
        var panelIsVisible = panel.is(":visible"); // Zeigt an, ob das Panel gerade sichtbar ist
        var userId = this._id; // Die ID des zu bearbeitenden Users
        var lastSelection = Session.get("user_options_selected_user"); // Die letzte Auswahl
        // Letzte Auswahl ist identisch mit der Neuen:
        var newSelectionIsEqualToLastSelection = (lastSelection != null && userId == lastSelection._id);
        /**
         *  Diese Funktion sorgt dafür, dass das Panel mit den Richtigen Daten angezeigt wird.
         */
        var showPanelAndFillWithData = function () {
            if (!newSelectionIsEqualToLastSelection) {
                console.log("Reset form");
                AutoForm.resetForm("userUpdate"); // Nur resetten, wenn ein anderer Eintrag ausgewählt wird.
            }
            // Die Session-Variable "user_options_selected_user" wird befüllt mit dem User, der die gegebene ID hat.
            // Diese Sessionvariable ist über den Template-Helper selectedUser im Template "adminUsers" zugreifbar.
            Session.set("user_options_selected_user", Meteor.users.findOne({
                "_id": userId
            }));
            // Wenn alles fertig ist, soll das Panel wieder angezeigt werden.
            panel.show('slide', {
                direction: 'right',
                easing: 'easeInOutCubic'
            }, 400, function () {
                $('body').scrollTo(panel, { duration: 'slow' }); // Scrollt die Anzeige zum Panel
            });
        };
        // Fallunterscheidung: Wenn das Panel schon sichtbar ist, dann muss es erst verborgen werden
        if (panelIsVisible && !newSelectionIsEqualToLastSelection) {
            // Versteckt das Panel und ruft danach showPanelAndFillWithData() auf
            panel.hide('slide', {
                direction: 'right',
                easing: "easeInOutCubic"
            }, 400, showPanelAndFillWithData);
        }
        else {
            // Wenn es nicht sichtbar ist, dann wird gleich showPanelAndFillWithData() aufgerufen
            showPanelAndFillWithData();
        }
    },
    'click .remove-user': function () {
        // Variablen zur einfacheren Handhabung
        var userId = this._id; // Die ID des zu bearbeitenden Users

        bootbox.confirm({
          message: "Den User wirklich löschen?",
          callback(result: boolean) {
            if (!result) {
              return;
            }
            var proxy = new ServerMethodsWrapper.AdminUserProxy(userId);
            proxy.removeUser(function(error) {
              if (error) {
                console.error("Was trying to remove an user: ", error);
                alert("Fehler: " + error.toString());
              }
            });
          }
        });
    }
});
// Wenn das userUpdate Formular abgeschickt wurde, dann soll das Panel versteckt werden.
AutoForm.hooks({
    userUpdate: {
        onSuccess: function (formType, result) {
            var panel = $(".edit-user-panel");
            var self = this;
            panel.hide('slide', {
                direction: 'right'
            }, 200, function () {
                self.resetForm();
            });
        }
    }
});
//# sourceMappingURL=AdminUsers.js.map


import { AutoForm } from "meteor/aldeed:autoform";
import { Meteor } from "meteor/meteor";
import { Session } from "meteor/session";
import { Template } from "meteor/templating";

import { GroupDAO, Groups } from "../../../../collections/lib/GroupCollection";

import { Helper } from "../../../../lib/HelperDecorator";
import { TemplateDefinition } from "../../../../lib/TemplateDefinitionDecorator";


@TemplateDefinition("modifyGroups")
class ModifyGroupsData {

  @Helper
  static userListHelper() {
    return Meteor.users.find({}, {}).map(function (c) {
      return {
        label: (c.profile.first_name + " " + c.profile.last_name),
        value: c._id
      };
    });
  }

  @Helper
  static selectedGroup(): GroupDAO {
    return Session.get("groupOptions_selected_group");
  }

  @Helper
  static groupsCollection() {
    return Groups;
  }
}


Template["modifyGroups"].onRendered(function () {
  let updatePanel = $(".update-panel"); // Das Panel
  updatePanel.hide();
});
Template["modifyGroups"].onCreated(function () {
  Session.set("groupOptions_selected_group", null);
});

Template["groupOptions"].events({
  "click .edit-group": function () {
    let panel = $(".update-panel"); // Das Panel
    let insertPanel = $(".insert-panel");
    let panelIsVisible = panel.is(":visible"); // Zeigt an, ob das Panel gerade sichtbar ist
    let lastSelection = Session.get("groupOptions_selected_group"); // Die letzte Auswahl
    let groupId = this._id;
    // Letzte Auswahl ist identisch mit der Neuen:
    let newSelectionIsEqualToLastSelection = (lastSelection != null && groupId === lastSelection._id);
    console.log("Session.get(\"groupOptions_selected_group\")", Session.get("groupOptions_selected_group"));
    /**
     *  Diese Funktion sorgt dafür, dass das Panel mit den Richtigen Daten angezeigt wird.
     */
    let showPanelAndFillWithData = function () {
      if (!newSelectionIsEqualToLastSelection) {
        console.log("Reset form");
        AutoForm.resetForm("updateGroupForm"); // Nur resetten, wenn ein anderer Eintrag ausgewählt wird.
      }

      Session.set("groupOptions_selected_group", Groups.findOne({ _id: groupId })); // hier wird die Sessionvariable mit den Daten des Tabelleneintrags gefüllt.


      // Wenn alles fertig ist, soll das Panel wieder angezeigt werden.
      panel.show("slide", {
        direction: "right",
        easing: "easeInOutCubic"
      }, 400, function () {
        $("body").scrollTo(panel, { duration: "slow" }); // Scrollt die Anzeige zum Panel
      });
    };
    // Fallunterscheidung: Wenn das Panel schon sichtbar ist, dann muss es erst verborgen werden
    if (panelIsVisible && !newSelectionIsEqualToLastSelection) {
      // Versteckt das Panel und ruft danach showPanelAndFillWithData() auf
      panel.hide("slide", {
        direction: "right",
        easing: "easeInOutCubic"
      }, 400, showPanelAndFillWithData);
    } else {
      // Wenn es nicht sichtbar ist, dann wird gleich showPanelAndFillWithData() aufgerufen,
      // nachdem das Insert-Panel versteckt wurde.
      insertPanel.hide("slide", {
        direction: "right"
      }, 200, showPanelAndFillWithData);
    }
  }

});


Template["modifyGroups"].events({
  "click .cancel-update": function () {
    let panel = $(".update-panel"); // Das Panel
    let insertPanel = $(".insert-panel");
    panel.hide("slide", {
      direction: "right",
      easing: "easeInOutCubic"
    }, 400, function () {
      insertPanel.show("slide", {
        direction: "right",
        easing: "easeInOutCubic"
      }, 400);
    });
  }
});
// Wenn das userUpdate Formular abgeschickt wurde, dann soll das Panel versteckt werden.
AutoForm.hooks({
  updateGroupForm: {
    onSuccess: function (formType, result) {
      let panel = $(".update-panel");
      let insertPanel = $(".insert-panel");
      panel.hide("slide", {
        direction: "right"
      }, 200, function () {
        insertPanel.show("slide", {
          direction: "right",
          easing: "easeInOutCubic"
        }, 400);
      });
    }
  }
});

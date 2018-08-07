import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Session } from "meteor/session";
import { Mongo } from "meteor/mongo";
import { Accounts } from "meteor/accounts-base";

import { GroupApplicationController } from "../../collections/lib/classes/Group";
import { Groups, GroupDAO } from "../../collections/lib/GroupCollection";

import { Helper } from "../../lib/HelperDecorator";
import { TemplateDefinition } from "../../lib/TemplateDefinitionDecorator";

import { version } from "../../Version"
import User from "../../collections/lib/classes/User";

namespace SideBar {

  export function metisMenu() {
    $("#side-menu").metisMenu();
  }

}



Template["sidebar"].onRendered(function () {
  $(window).trigger("resize");
  let instance = Template.instance();

  instance.subscribe("ownUserData");
  instance.subscribe("coordinatingGroups");

  instance.autorun(function () {
    // Bei Änderung des Users oder der Gruppen neu initialisieren
    Meteor.user();
    Groups.find(
      {
        coordinators: { $in: [Meteor.userId()] }
      },
      { fields: { "_id": 1 } }).fetch();

    if (instance.subscriptionsReady()) {
      SideBar.metisMenu();
    }
  });

});


Template["sidebar"].helpers({
  /**
   * Bestimmt alle Gruppen, deren Koordinator der User ist.
   * @returns {any|Mongo.Cursor}
   */
  coordinatingGroups: function (): Mongo.Cursor<GroupDAO> {
    return Groups.find(
      {
        coordinators: { $in: [Meteor.userId()] }
      },
      { sort: { name: 1 } });
  },
  version() {
    return version;
  },
  isUserCoordinatorInAnyGroup() {
    var user: User = new User(Meteor.userId());
    return user.isCoordinatorInAnyGroup(true);
  }
});



@TemplateDefinition("groupMenuEntry")
class GroupMenuEntry {

  /**
   * Gibt die Anzahl der Bewerber zurück.
   * @returns {int}
   */
  @Helper
  static pendingUsersCount(): number {
    let context = <GroupDAO>Template.instance().data;
    let applicationCountAccessor = new GroupApplicationController(context._id);

    return applicationCountAccessor.applicationsCount;
  }

  @Helper
  static pendingUsersExist(): boolean {
    return GroupMenuEntry.pendingUsersCount() > 0;
  }
}

Template["groupMenuEntry"].onRendered(function () {
  $(window).trigger("resize");
  let instance = Template.instance();

  instance.subscribe("userList", Meteor.userId());





});

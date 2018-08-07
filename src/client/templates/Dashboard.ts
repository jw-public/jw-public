import {Meteor} from "meteor/meteor";
import {Template} from "meteor/templating";
import {Session} from "meteor/session";
import {Mongo} from "meteor/mongo";
import {Blaze} from "meteor/blaze";
import {ReactiveVar} from "meteor/reactive-var";

import Assignment from "../../collections/lib/classes/Assignment";
import AssignmentCountAccessor from "../../collections/lib/classes/AssignmentCountAccessor";
import User from "../../collections/lib/classes/User";
import * as UserCollection from "../../collections/lib/UserCollection";

import Group from "../../collections/lib/classes/Group";
import {GroupApplicationController} from "../../collections/lib/classes/Group";
import {Groups} from "../../collections/lib/GroupCollection";

import {Helper} from "../../lib/HelperDecorator";
import {TemplateDefinition} from "../../lib/TemplateDefinitionDecorator";

import {getUserDataSubscription} from "../../subscribe";

import * as moment from "moment";


interface DashboardPanel {
  panelClass: string;
  fontAwesomeIcon: string;
  hugeContent: string;
  smallContent: string;
  footerDescription: string;
  showLink: boolean;
  link: string;
}

@TemplateDefinition("dashboard")
class DashboardGreetingData {
  @Helper
  static greeting(): string {
    let user = Meteor.user();

    if (_.isUndefined(user) || _.isNull(user)) {
      return "Hallo, hier ist deine Übersicht";
    }

    return `Hallo ${user.profile.first_name}, hier ist deine Übersicht`;
  }
}


@TemplateDefinition("dashboard")
class DashboardAdminData {

  @Helper
  static adminUserPanel(): DashboardPanel {
    let userDAO = Meteor.user();
    let user = User.createFromDAO(userDAO);
    if (!userDAO || !user.isAdmin()) {
      return null;
    }
    return {
      panelClass: "panel-green",
      fontAwesomeIcon: "fa-users",
      hugeContent: DashboardAdminData.getUserCount().toString(),
      smallContent: "Benutzer",
      footerDescription: "Benutzerverwaltung.",
      showLink: true,
      link: FlowRouter.path("adminUsers", {}, {}),
    };
  }

  private static getUserCount(): number {
    return Template.instance()["userCount"].get();
  }
}


Template["dashboard"].helpers({
  profile: function(): UserCollection.UserProfile {
    let user = Meteor.user();

    if (_.isUndefined(user) || _.isNull(user)) {
      return null;
    }

    return user.profile;
  },
  groups: function() {

    /**
     * Ein Objekt, das den Eintrag des eingeloggten Users enthält.
     * @type {object}
     */

    let user = UserCollection.users.findOne({ _id: Meteor.userId() },
      { fields: { "groups": 1 } });

    return Groups.find(
      {
        _id: { $in: user.groups }
      },
      { sort: { name: 1 } });
  },

  trolleyAssignmentPanels: function(): Array<DashboardPanel> {
    let userDAO = Meteor.user();
    let user = User.createFromDAO(userDAO);

    if (!userDAO || !Template.instance().subscriptionsReady()) {
      return [];
    }

    let groupIds = user.getGroupIdsReactive();


    if (_.isNull(groupIds) || groupIds.length === 0) {
      return [];
    }

    let panels: Array<DashboardPanel> = new Array();


    _.forEach(groupIds, function(groupId) {
    let group = new Group(groupId);
    let singleObject: DashboardPanel = null;
    let countAccessor = new AssignmentCountAccessor(groupId);
    let assignmentCount: number = countAccessor.count;
    let hasAssignments = assignmentCount > 0;

      if (hasAssignments) {
        singleObject = {
          panelClass: "panel-primary",
          fontAwesomeIcon: "fa-pencil-square-o",
          hugeContent: assignmentCount.toString(),
          smallContent: "Termine in " + group.name + "",
          showLink: true,
          link: FlowRouter.path("assignment-list", { groupId: group.getId(), yearMonth: Assignment.convertDateToMonthString(moment()) }, {}),
          footerDescription: "Zur Terminansicht",
        };
      } else {
        singleObject = {
          panelClass: "panel-primary",
          fontAwesomeIcon: "fa-pencil-square-o",
          hugeContent: assignmentCount.toString(),
          smallContent: "Termine in " + group.name + "",
          showLink: false,
          link: null,
          footerDescription: "Bald werden wieder Termine verfügbar sein.",
        };
      }

      panels.push(singleObject);
    });

    return panels;
  },

  pendingApplicationsForGroupCoordinator: function(): Array<DashboardPanel> {

    let userDAO = Meteor.user();

    if (!userDAO) {
      return [];
    }

    let groups = User.createFromDAO(userDAO).getCoordinatingGroups(true);

    if (_.isNull(groups) || groups.length === 0) {
      return [];
    }

    let panels: Array<DashboardPanel> = new Array();

    _.forEach(groups, function(group: Group) {
      let applicationController = new GroupApplicationController(group.getId());

      let applicationsCount: number = applicationController.applicationsCount;
      if (applicationsCount > 0) {
        panels.push({
          panelClass: "panel-red",
          fontAwesomeIcon: "fa-list-alt",
          hugeContent: applicationsCount.toString(),
          smallContent: "Gruppenanfrage(n) für " + group.name + "",
          footerDescription: "Bewerbungen bearbeiten",
          showLink: true,
          link: FlowRouter.path("groupApplicants", { groupId: group.getId() }, {}),
        });
      }
    });

    return panels;
  },

  ownPendingApplicationsForGroupPanels: function(): Array<DashboardPanel> {
    let userDAO = Meteor.user();

    if (!userDAO) {
      return [];
    }

    let groups = User.createFromDAO(userDAO).pendingGroups;

    if (_.isNull(groups) || groups.length === 0) {
      return [];
    }

    let panels: Array<DashboardPanel> = new Array();

    _.forEach(groups, function(group) {
      panels.push({
        panelClass: "panel-green",
        fontAwesomeIcon: "fa-check",
        hugeContent: "Anfrage",
        smallContent: "für " + group.name,
        footerDescription: "Die Anfrage wird bearbeitet.",
        showLink: false,
        link: null,
      });
    });

    return panels;
  }



});


namespace Dashboard {

  export function loadUserCountInto(ReactiveVar: ReactiveVar<string>): void {
    Meteor.call("getAllUsersCount", function(err, asyncValue) {
      if (err)
        console.log(err);
      else
        ReactiveVar.set(asyncValue);
    });
  }

  export function subscribeAssignmentCounts(instance: Blaze.TemplateInstance) {
    if (getUserDataSubscription().ready()) {
      let groupIds = User.current().getGroupIdsReactive();
      _.each(groupIds, (groupId) => {
        let accessor = new AssignmentCountAccessor(groupId);
        accessor.subscribeCountOnTemplate(instance);
      });
    }
  }


}

Template["dashboard"].created = function() {
  let instance = Template.instance();
  this.userCount = new ReactiveVar("");

  Dashboard.loadUserCountInto(this.userCount);
  Dashboard.subscribeAssignmentCounts(instance);

  instance.autorun(() => {
    if (Meteor.userId()) {
      Dashboard.loadUserCountInto(this.userCount);

      Dashboard.subscribeAssignmentCounts(instance);
    }
  });
};

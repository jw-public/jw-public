import * as _ from "underscore";

import { Roles } from "meteor/alanning:roles";
import { Meteor } from "meteor/meteor";

import { subsCache } from "../../client/lib/subscription-cache";

import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import * as MainLayout from "../../client/templates/MainLayout";

export namespace Routes {

  export const ParamNames = {
    GroupId: "groupId",
    YearMonth: "yearMonth",
    AssignmentId: "assignmentId",
    Token: "token"
  }

  export class Def {
    constructor(public name: string, public path: string) {

    }

    static Home = new Def("home", "/");
    static AssignmentOverview = new Def("assignment-list", "/group/:" + ParamNames.GroupId + "/:" + ParamNames.YearMonth + "/overview");
    static AssignmentManagement = new Def("manage-assignment", "/group/:" + ParamNames.GroupId + "/manage-assignments");
    static AssignmentSingleView = new Def("singleAssignment", "/einsatz/:" + ParamNames.AssignmentId);
    static UserManagement = new Def("adminUsers", "/admin/users");
    static GroupManagement = new Def("modifyGroups", "/admin/groups");
    static EmailServerManagement = new Def("settingsEmailserver", "/admin/manage/emailserver");
    static MyProfile = new Def("modifyProfile", "/my-profile");
    static Login = new Def("login", "/login");
    static Logout = new Def("logout", "/logout");
    static UserRegistration = new Def("registerInGroup", "/group/:" + ParamNames.GroupId + "/registrierung");
    static GroupApplicants = new Def("groupApplicants", "/group/:" + ParamNames.GroupId + "/bewerber");
    static GroupMembers = new Def("groupMembers", "/group/:" + ParamNames.GroupId + "/mitglieder");
    static InfoSite = new Def("infoSite", "/info");
    static BlueprintManagement = new Def("manage-blueprints", "/group/:" + ParamNames.GroupId + "/manage-blueprints");
    static CopyAssignments = new Def("copyAssignments", "/group/:" + ParamNames.GroupId + "/copy-assignments");
    static ResetPassword = new Def("resetPassword", "/reset-password/:" + ParamNames.Token);
  }


  export function route(route: Def, routeDefinition: FlowRouter.RouteDefinition) {

    routeDefinition = _.defaults(routeDefinition, { name: route.name });

    FlowRouter.route(route.path, routeDefinition);
  }

  export function go(route: Def, params?: FlowRouter.Parameters, queryParams?: FlowRouter.Parameters): void {
    FlowRouter.go(route.name, params, queryParams);
  }
}


// triggersEnter
var requiredLogin: FlowRouter.Trigger = function (context, redirect) {
  // Wir stellen sicher, dass nur registrierte Nutzer Zugriff auf die Profilseite haben.
  // (Siehe die Rolle "Registrierter User" im Anwendungsfalldiagramm.)
  var user = Meteor.userId();
  if (_.isUndefined(user) || _.isNull(user)) {
    redirect(`${Routes.Def.Login.path}?goto=${context.path}`);
  }
}

var requiredLoggedOut: FlowRouter.Trigger = function (context, redirect) {
  var user = Meteor.user();
  if (!_.isNull(user)) {
    redirect(Routes.Def.Home.path);
  }
}


var requiredAdmin: FlowRouter.Trigger = function (context, redirect) {
  var user = Meteor.userId();
  if (!user || !Roles.userIsInRole(user, "admin")) {
    redirect(Routes.Def.Home.path);
  }
}

// Die Routen/URLs festlegen:

Routes.route(Routes.Def.Home, {

  // an array of triggersEnter
  triggersEnter: [requiredLogin],

  // define your subscriptions
  subscriptions: function (params, queryParams) {
    this.register("groups", Meteor.subscribe("groups"));
    this.register("pendingGroups", Meteor.subscribe("pendingGroups"));
  },

  // do some action for this route
  action: function (params, queryParams) {
    if (!_.isUndefined(Meteor.userId())) {
      BlazeLayout.render<MainLayout.Context>("MainLayout", { main: "dashboard" });
    } else {
      Routes.go(Routes.Def.Login);
    }
  }
});


Routes.route(Routes.Def.UserManagement, {
  // an array of triggersEnter
  triggersEnter: [requiredAdmin],

  // define your subscriptions
  subscriptions: function (params, queryParams) {
  },

  // do some action for this route
  action: function (params, queryParams) {

    BlazeLayout.render<MainLayout.Context>("MainLayout", { main: "adminUsers" });

  }
});


Routes.route(Routes.Def.GroupManagement, {
  // an array of triggersEnter
  triggersEnter: [requiredAdmin],


  // define your subscriptions
  subscriptions: function (params, queryParams) {

  },

  // do some action for this route
  action: function (params, queryParams) {

    BlazeLayout.render<MainLayout.Context>("MainLayout", { main: "modifyGroups" });
  }
});


Routes.route(Routes.Def.EmailServerManagement, {

  // an array of triggersEnter
  triggersEnter: [requiredAdmin],


  // define your subscriptions
  subscriptions: function (params, queryParams) {
    this.register("emailserverSetting", Meteor.subscribe("emailserverSetting"));
  },

  // do some action for this route
  action: function (params, queryParams) {

    BlazeLayout.render<MainLayout.Context>("MainLayout", { main: "settingsEmailserver" });
  }
});



Routes.route(Routes.Def.MyProfile, {



  // an array of triggersEnter
  triggersEnter: [requiredLogin],

  // define your subscriptions
  subscriptions: function (params, queryParams) {

  },

  // do some action for this route
  action: function (params, queryParams) {
    BlazeLayout.render<MainLayout.Context>("MainLayout", { main: "modifyProfile" });
  }
});


Routes.route(Routes.Def.Login, {

  // an array of triggersEnter
  triggersEnter: [requiredLoggedOut],

  // define your subscriptions
  subscriptions: function (params, queryParams) {

  },

  // do some action for this route
  action: function (params, queryParams) {
    BlazeLayout.render("ParallaxScreen", { main: "Login" });
  }
});


Routes.route(Routes.Def.UserRegistration, {


  // an array of triggersEnter
  triggersEnter: [],

  // define your subscriptions
  subscriptions: function (params, queryParams) {
    this.register("groupName", Meteor.subscribe("groupName", params["groupId"]));
  },

  // do some action for this route
  action: function (params, queryParams) {
    Meteor.call("groupExists", params["groupId"], function (err, groupExists) {
      if (!err && groupExists) {
        BlazeLayout.render("ParallaxScreen", { main: "RegisterInGroup" });
      }
    });
  }
});

Routes.route(Routes.Def.AssignmentOverview, {

  // an array of triggersEnter
  triggersEnter: [requiredLogin],

  // define your subscriptions
  subscriptions: function (params, queryParams) {
    this.register("groups", Meteor.subscribe("groups"));
  },

  // do some action for this route
  action: function (params, queryParams) {
    BlazeLayout.render<MainLayout.Context>("MainLayout", { main: "showOverview" });
  }
});


Routes.route(Routes.Def.AssignmentManagement, {

  // an array of triggersEnter
  triggersEnter: [requiredLogin],

  // define your subscriptions
  subscriptions: function (params, queryParams) {
    this.register("groups", Meteor.subscribe("groups"));
  },

  // do some action for this route
  action: function (params, queryParams) {
    BlazeLayout.render<MainLayout.Context>("MainLayout", { main: "manageAssignments" });
  }
});

Routes.route(Routes.Def.BlueprintManagement, {

  // an array of triggersEnter
  triggersEnter: [requiredLogin],

  // define your subscriptions
  subscriptions: function (params, queryParams) {
    this.register("groups", Meteor.subscribe("groups"));
    this.register("allBlueprintsOfGroup", Meteor.subscribe("allBlueprintsOfGroup", params["groupId"]));
  },

  // do some action for this route
  action: function (params, queryParams) {
    BlazeLayout.render<MainLayout.Context>("MainLayout", { main: "manageBlueprints" });
  }
});



Routes.route(Routes.Def.GroupApplicants, {

  // an array of triggersEnter
  triggersEnter: [requiredLogin],

  // define your subscriptions
  subscriptions: function (params, queryParams) {
    this.register("groups", Meteor.subscribe("groups"));
  },

  // do some action for this route
  action: function (params, queryParams) {
    BlazeLayout.render<MainLayout.Context>("MainLayout", { main: "manageApplicants" });
  }
});

// route for copy-assignments
Routes.route(Routes.Def.CopyAssignments, {

  triggersEnter: [requiredLogin],

  subscriptions: function (params, queryParams) {
    this.register("groups", Meteor.subscribe("groups"));
  },

  action: function (params, queryParams) {
    BlazeLayout.render<MainLayout.Context>("MainLayout", { main: "copyAssignments" });
  }
}
);



Routes.route(Routes.Def.GroupMembers, {
  // an array of triggersEnter
  triggersEnter: [requiredLogin],

  // define your subscriptions
  subscriptions: function (params, queryParams) {
    this.register("groups", Meteor.subscribe("groups"));
  },

  // do some action for this route
  action: function (params, queryParams) {
    BlazeLayout.render<MainLayout.Context>("MainLayout", { main: "overviewGroupMembers" });
  }
});


Routes.route(Routes.Def.AssignmentSingleView, {

  // an array of triggersEnter
  triggersEnter: [requiredLogin],

  // define your subscriptions
  subscriptions: function (params, queryParams) {
  },

  // do some action for this route
  action: function (params, queryParams) {
    BlazeLayout.render<MainLayout.Context>("MainLayout", { main: "singleAssignmentView" });
  }
});


Routes.route(Routes.Def.Logout, {

  // an array of triggersEnter
  triggersEnter: [requiredLogin],

  // define your subscriptions
  subscriptions: function (params, queryParams) {

  },

  // do some action for this route
  action: function (params, queryParams) {
    Meteor.logout(function () {
      subsCache.clear();
      Routes.go(Routes.Def.Login);
    });
  }
});


Routes.route(Routes.Def.InfoSite, {

  // an array of triggersEnter
  triggersEnter: [requiredLogin],

  // define your subscriptions
  subscriptions: function (params, queryParams) {

  },

  // do some action for this route
  action: function (params, queryParams) {
    BlazeLayout.render<MainLayout.Context>("MainLayout", { main: "infoSite" });
  }
});

Routes.route(Routes.Def.ResetPassword, {
  // an array of triggersEnter
  triggersEnter: [],

  // define your subscriptions
  subscriptions: function (params, queryParams) {
  },

  // do some action for this route
  action: function (params, queryParams) {
    BlazeLayout.render("ParallaxScreen", { main: "resetPassword" });
  }
});

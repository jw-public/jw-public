import {Meteor} from "meteor/meteor";
import {Template} from "meteor/templating";
import {Session} from "meteor/session";
import {Mongo} from "meteor/mongo";


import User from "../../../collections/lib/classes/User";
import {Groups, GroupDAO} from "../../../collections/lib/GroupCollection";

import * as ServerMethodsWrapper from "../../../lib/classes/ServerMethodsWrapper";
import * as AssignmentCancelModal from "../components/assignmentCancelModal/AssignmentCancelModal";

Template["manageApplicants"].helpers({
  selectForGroup: function(): any { // Zusätzlicher Selektor für die Tabelle, damit nur Bewerber für die spezielle Gruppe angezeigt werden.
    return {
      "profile.pendingGroups": {
        $in: [FlowRouter.getParam("groupId")]
      }
    };
  },
  currentGroup: function(): GroupDAO {
    return Groups.findOne({
      "_id": FlowRouter.getParam("groupId")
    });
  }
});

Template["applicantsOptions"].events({
  "click .accept-user": function() {
    console.log("Adding User " + this._id + " zur Gruppe " + FlowRouter.getParam("groupId"));

    let proxy = new ServerMethodsWrapper.GroupProxy(FlowRouter.getParam("groupId"));

    proxy.addUserToGroup(this._id, function(err: Meteor.Error) {
      if (err) {
        console.error("Fehler bei Annehmen:", err);
        alert(err.reason);
      }
    });
  },

  "click .deny-user": function() {
    let user = User.createFromId(this._id);

    console.log("Denying User " + this._id + " " + FlowRouter.getParam("groupId"));

    bootbox.confirm("Anfrage von " + user.fullName + " (" + user.email + ") ablehnen.", function(result) {
      if (result) {
        let proxy = new ServerMethodsWrapper.GroupProxy(FlowRouter.getParam("groupId"));
        proxy.denyUser(user.getId(), function(err) {
          if (err) {
            console.error("Fehler bem Ablehnen:", err);
            alert(err.reason);
          }
        });
      }
    });


  }
});

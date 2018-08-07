import {Meteor} from "meteor/meteor";
import {Mongo} from "meteor/mongo";
import {Random} from "meteor/random";
import {Roles} from "meteor/alanning:roles";
import {Accounts} from "meteor/accounts-base";

import Group from "../../../collections/lib/classes/Group";
import {Groups, GroupDAO} from "../../../collections/lib/GroupCollection";

import User from "../../../collections/lib/classes/User";
import * as UserCollection from "../../../collections/lib/UserCollection";
import * as UserNotification from "../../../collections/lib/classes/UserNotification";
import {Notifications} from "../../../collections/lib/NotificationCollection";

import Assignment from "../../../collections/lib/classes/Assignment";
import {AssignmentState} from "../../../collections/lib/classes/AssignmentState";
import {UserEntry, AssignmentDAO, Assignments} from "../../../collections/lib/AssignmentsCollection";
import {CollectionConf} from "../../../collections/lib/collectionConfig/CollectionConf";


if (!(typeof MochaWeb === 'undefined')) {

  MochaWeb.testOnly(function() {

    before(function() {
      CollectionConf.IS_TEST = true;
      var testGroupDao: GroupDAO = Groups.findOne({ name: "Test" });
      var group: Group = new Group(testGroupDao._id);

      Accounts.createUser({
        email: "flue@wet.de",
        password: "12345",
        profile: {
          first_name: "Not",
          last_name: "Wanted",
          gender: "Male",
          pendingGroups: [testGroupDao._id.toString()],
          mobile: "0176 480 370 15",
          zip: "85435",
          placeName: "Erding",
        }
      });

      var id = Accounts.createUser({
        email: "not_in_two_groups@wet.de",
        password: "12345",
        profile: {
          first_name: "Partly",
          last_name: "Wanted",
          gender: "Male",
          pendingGroups: [testGroupDao._id.toString()],
          mobile: "0176 480 370 15",
          zip: "85435",
          placeName: "Erding",
        }
      });


      var newGroupId = Groups.insert({
        name: "Tidelue",
        creator: Random.id()
      }); // Neu einfügen

      var newGroup = new Group(newGroupId);

      newGroup.addUserAsGroupMemberById(id);

      chai.assert.isTrue(newGroup.exists());
      chai.assert.isTrue(newGroup.isMemberById(id));


      CollectionConf.IS_TEST = false;
    });

    after(function() {
      Groups.remove({
        name: "Tidelue",
      });
    });


    describe("Methods", function() {
      it("[denyUser] User is deleted when not in another group.", function(done) {
        // Arrange
        var user = User.createFromEmail("flue@wet.de");
        var testGroupDao: GroupDAO = Groups.findOne({ name: "Test" });
        var group: Group = new Group(testGroupDao._id);

        // Act
        Meteor.call("denyUser", user.getId(), testGroupDao._id);

        // Assert
        chai.assert.isFalse(User.userExists("flue@wet.de"));

        done();
      });

      it("[denyUser] User is not deleted when in another group.", function(done) {
        // Arrange
        var user = User.createFromEmail("not_in_two_groups@wet.de");
        var testGroupDao: GroupDAO = Groups.findOne({ name: "Test" });
        var group: Group = new Group(testGroupDao._id);
        chai.assert.isTrue(group.isApplicantById(user.getId()));

        // Act
        Meteor.call("denyUser", user.getId(), testGroupDao._id);

        // Assert
        chai.assert.isTrue(User.userExists("not_in_two_groups@wet.de"));
        chai.assert.isFalse(group.isApplicantById(user.getId()));
        chai.assert.isFalse(group.isMemberById(user.getId()));


        done();
      });
    });
  });
}

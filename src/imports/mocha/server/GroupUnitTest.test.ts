import { Meteor } from "meteor/meteor";
import * as _ from "underscore";

import Group from "../../../collections/lib/classes/Group";
import { GroupDAO, Groups } from "../../../collections/lib/GroupCollection";

import User from "../../../collections/lib/classes/User";
import * as UserCollection from "../../../collections/lib/UserCollection";


if (!(typeof MochaWeb === 'undefined')) {

    MochaWeb.testOnly(function () {



        describe("Group Unit Test", function () {
            it("[User] Bewerbung, Teilnahme und Entfernen als Zyklus", function (done) {
                var exampleUser: UserCollection.UserDAO = Meteor.users.findOne({});
                var testGroupDao: GroupDAO = Groups.findOne({ name: "Test" });

                var group: Group = Group.createFromDAO(testGroupDao);

                chai.assert.isDefined(testGroupDao, "Es gibt keine Gruppe \"Test\"");
                chai.assert.isNotNull(testGroupDao, "Es gibt keine Gruppe \"Test\"");
                chai.assert.isDefined(testGroupDao._id, "Gruppe \"Test\" hat kein _id Attribut.");
                chai.assert.isDefined(exampleUser._id, "User hat kein _id Attribut.");



                // Überprüfen, ob die Ausgangssituation wie erwartet ist.
                chai.assert(group.isMemberByDAO(exampleUser), "Beispiel User sollte zu Beginn ein Mitglied der Gruppe \"Test\" sein");
                chai.assert(!group.isApplicant(exampleUser), "Beispiel User sollte zu Beginn kein Bewerber der Gruppe \"Test\" sein");


                // User von den Mitgliedern entfernen
                group.removeUserAsMember(exampleUser);

                chai.assert(!group.isMemberByDAO(exampleUser), "Beispiel User sollte nach Entfernen kein Mitglied der Gruppe \"Test\" sein");
                chai.assert(!group.isApplicant(exampleUser), "Beispiel User sollte nach Entfernen kein Bewerber der Gruppe \"Test\" sein");

                // User als Bewerber eintragen
                group.addUserAsApplicantByDAO(exampleUser);

                chai.assert(!group.isMemberByDAO(exampleUser), "Beispiel User sollte nach dem Bewerben kein Mitglied der Gruppe \"Test\" sein");
                chai.assert(group.isApplicant(exampleUser), "Beispiel User sollte nach dem Bewerben ein Bewerber der Gruppe \"Test\" sein");

                // User als Mitglied eintragen
                group.addUserAsGroupMemberByDAO(exampleUser);

                chai.assert(group.isMemberByDAO(exampleUser), "Beispiel User sollte nach dem Hinzufügen ein Mitglied der Gruppe \"Test\" sein");
                chai.assert(!group.isApplicant(exampleUser), "Beispiel User sollte nach dem Hinzufügen kein Bewerber der Gruppe \"Test\" sein");

                // User von den Mitgliedern entfernen

                group.removeUserAsMember(exampleUser);

                chai.assert(!group.isMemberByDAO(exampleUser), "Beispiel User sollte nach Entfernen kein Mitglied der Gruppe \"Test\" sein");
                chai.assert(!group.isApplicant(exampleUser), "Beispiel User sollte nach Entfernen kein Bewerber der Gruppe \"Test\" sein");

                group.addUserAsApplicantByDAO(exampleUser);
                chai.assert(group.isApplicant(exampleUser), "Beispiel User sollte nach dem Bewerben ein Bewerber der Gruppe \"Test\" sein");
                group.removeUserAsApplicant(exampleUser);
                chai.assert(!group.isApplicant(exampleUser), "Beispiel User sollte nach dem Entfernen der Bewerbung kein Bewerber der Gruppe \"Test\" sein");


                // User direkt (ohne Bewerbung) als Teilnehmer eintragen.
                group.addUserAsGroupMemberByDAO(exampleUser);

                chai.assert(group.isMemberByDAO(exampleUser), "Beispiel User sollte nach dem Hinzufügen ein Mitglied der Gruppe \"Test\" sein");
                chai.assert(!group.isApplicant(exampleUser), "Beispiel User sollte nach dem Hinzufügen kein Bewerber der Gruppe \"Test\" sein");

                done();
            });


            it("[Notification] Notification an alle Gruppenmitglieder", function (done) {
                var testGroupDao: GroupDAO = Groups.findOne({ name: "Test" });

                var group: Group = Group.createFromDAO(testGroupDao);

                chai.assert.isDefined(testGroupDao, "Es gibt keine Gruppe \"Test\"");
                chai.assert.isNotNull(testGroupDao, "Es gibt keine Gruppe \"Test\"");
                chai.assert.isDefined(testGroupDao._id, "Gruppe \"Test\" hat kein _id Attribut.");

                var members: Array<User> = group.getMembers();
                chai.assert(members.length > 0, "Die Gruppe gibt keine Mitglieder zurück. (.getMembers())");
                var notificationCount = new Object;

                _.forEach(members, function (member: User) {
                    chai.assert(group.isMember(member), "Der User " + member.fullName + " sollte nicht in der Mitgliederauflistung sein.");
                    var count: number = member.notificationManager.getAllNotifications().count();
                    notificationCount[member.getId()] = count;
                });


                group.sendNotificationToMembers("Test", "Dies ist eine Testbenachrichtigung.");

                _.forEach(members, function (member: User) {
                    var count: number = member.notificationManager.getAllNotifications().count();
                    chai.assert.equal(count, (notificationCount[member.getId()] + 1), "Der User " + member.fullName + " hat keine Gruppennotification bekommen.");
                });


                done();
            });

            it("[User] Koordinator hinzufügen und entfernen als Zyklus", function (done) {
                var user: User = User.createFromEmail("to_be_upgraded@user.com");
                var userDAO: UserCollection.UserDAO = user.getDAO();
                var testGroupDao: GroupDAO = Groups.findOne({ name: "Test" });

                var group: Group = new Group(testGroupDao._id);

                chai.assert.isDefined(testGroupDao, "Es gibt keine Gruppe \"Test\"");
                chai.assert.isNotNull(testGroupDao, "Es gibt keine Gruppe \"Test\"");


                // Überprüfen, ob die Ausgangssituation wie erwartet ist.
                chai.assert(group.isMemberByDAO(userDAO), "Beispiel User sollte zu Beginn ein Mitglied der Gruppe \"Test\" sein");
                chai.assert(!user.isGroupCoordinator(group), "Beispiel User sollte zu Beginn kein Koordinator der Gruppe \"Test\" sein");
                chai.assert(!user.isCoordinatorInAnyGroup(), "Beispiel User sollte zu Beginn nicht ein Koordinator einer Gruppe \"Test\" sein");


                group.addAsCoordinator(user);

                chai.assert(user.isGroupCoordinator(group), "Beispiel User sollte nach dem Setzen ein Koordinator der Gruppe \"Test\" sein");
                chai.assert(user.isCoordinatorInAnyGroup(), "Beispiel User sollte nach dem Setzen ein Koordinator einer beliebigen Gruppe \"Test\" sein");


                group.removeAsCoordinator(user);

                chai.assert(!user.isGroupCoordinator(group), "Beispiel User sollte nach dem Entfernen kein Koordinator der Gruppe \"Test\" sein");
                chai.assert(!user.isCoordinatorInAnyGroup(), "Beispiel User sollte nach dem Entfernen nicht ein Koordinator einer Gruppe \"Test\" sein");

                done();
            });
        });
    });
}

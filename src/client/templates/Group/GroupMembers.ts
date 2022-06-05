import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Session } from "meteor/session";
import { Mongo } from "meteor/mongo";
import { Blaze } from "meteor/blaze";

import { Groups, GroupDAO } from "../../../collections/lib/GroupCollection";
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';


Template["overviewGroupMembers"].helpers({
    selectForGroup: function () { // Zusätzlicher Selektor für die Tabelle, damit nur Bewerber für die spezielle Gruppe angezeigt werden.
        return {
            "groups": {
                $in: [FlowRouter.getParam("groupId")]
            }
        };
    },
    currentGroup: function () {
        return Groups.findOne({
            "_id": FlowRouter.getParam("groupId")
        });
    }
});

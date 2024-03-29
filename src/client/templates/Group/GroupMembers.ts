import { Template } from "meteor/templating";

import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Groups } from "../../../collections/lib/GroupCollection";


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

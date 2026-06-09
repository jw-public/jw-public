import { Template } from "meteor/templating";
import GroupMembers from "./GroupMembersComponent";

Template["overviewGroupMembers"].helpers({
    GroupMembersComponent(): any {
        return GroupMembers;
    }
});

import { Template } from "meteor/templating";
import ModifyGroups from "./ModifyGroupsComponent";

Template["modifyGroups"].helpers({
    ModifyGroupsComponent(): any {
        return ModifyGroups;
    }
});

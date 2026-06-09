import { Template } from "meteor/templating";
import ModifyProfile from "./ModifyProfileComponent";

Template["modifyProfile"].helpers({
    ModifyProfileComponent(): any {
        return ModifyProfile;
    }
});

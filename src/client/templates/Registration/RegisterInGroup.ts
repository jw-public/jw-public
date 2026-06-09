import { Template } from "meteor/templating";
import RegisterInGroup from "./RegisterInGroupComponent";

Template["RegisterInGroup"].helpers({
    RegisterInGroupComponent(): any {
        return RegisterInGroup;
    }
});

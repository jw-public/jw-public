import { Template } from "meteor/templating";
import CopyAssignments from "./CopyAssignmentsComponent";

Template["copyAssignments"].helpers({
    CopyAssignmentsComponent(): any {
        return CopyAssignments;
    }
});

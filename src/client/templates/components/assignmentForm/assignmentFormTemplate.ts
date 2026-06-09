import { Template } from "meteor/templating";
import AssignmentFormComponent from "./AssignmentFormComponent";

Template["assignmentForm"].helpers({
    AssignmentFormComponent(): any {
        return AssignmentFormComponent;
    }
});

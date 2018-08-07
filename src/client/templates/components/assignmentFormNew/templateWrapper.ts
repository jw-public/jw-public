import { Template } from "meteor/templating";
import { SimpleForm } from "./AssignmentForm";

Template["assignmentForm_new"].helpers({
    SimpleForm(): any {
        return SimpleForm;
    }
});
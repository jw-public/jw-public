import { Template } from "meteor/templating";
import ManageAssignments from "./ManageAssignmentsComponent";

Template["manageAssignments"].helpers({
  ManageAssignmentsComponent(): any {
    return ManageAssignments;
  }
});

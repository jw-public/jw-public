import { Template } from "meteor/templating";
import AssignmentManagerComponent from "./AssignmentManagerComponent";

Template["assignmentManager"].helpers({
  AssignmentManagerComponent(): any {
    return AssignmentManagerComponent;
  }
});

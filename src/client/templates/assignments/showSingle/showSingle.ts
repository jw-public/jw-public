import { Template } from "meteor/templating";
import SingleAssignmentView from "./SingleAssignmentViewComponent";

Template["singleAssignmentView"].helpers({
    SingleAssignmentViewComponent(): any {
        return SingleAssignmentView;
    }
});

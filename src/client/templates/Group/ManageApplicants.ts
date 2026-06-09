import { Template } from "meteor/templating";
import ManageApplicants from "./ManageApplicantsComponent";

Template["manageApplicants"].helpers({
    ManageApplicantsComponent(): any {
        return ManageApplicants;
    }
});

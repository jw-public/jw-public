import { Template } from "meteor/templating";
import ResetPassword from "./ResetPasswordComponent";

Template["resetPassword"].helpers({
    ResetPasswordComponent(): any {
        return ResetPassword;
    }
});

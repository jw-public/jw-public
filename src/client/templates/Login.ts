import { Template } from "meteor/templating";
import Login from "./LoginComponent";

Template["Login"].helpers({
    LoginComponent(): any {
        return Login;
    }
});

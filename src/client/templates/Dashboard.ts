import { Template } from "meteor/templating";
import Dashboard from "./DashboardComponent";

Template["dashboard"].helpers({
    DashboardComponent(): any {
        return Dashboard;
    }
});

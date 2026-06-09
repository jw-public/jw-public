import { Template } from "meteor/templating";
import ShowOverview from "./ShowOverviewComponent";

Template["showOverview"].helpers({
    ShowOverviewComponent(): any {
        return ShowOverview;
    }
});

import { Template } from "meteor/templating";
import InfoSite from "./InfoSiteComponent";

Template["infoSite"].helpers({
    InfoSiteComponent(): any {
        return InfoSite;
    }
});

import { Template } from "meteor/templating";
import { ManageBlueprintsComponent } from './ManageBlueprintsComponent';


Template["manageBlueprints"].helpers({
    ManageBlueprintsComponent(): any {
        return ManageBlueprintsComponent;
    }
});
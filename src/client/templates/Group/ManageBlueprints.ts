import { ManageBlueprintsComponent } from './ManageBlueprintsComponent';
import { Template } from "meteor/templating";
import * as React from "react";
import * as ReactDOM from "react-dom";


Template["manageBlueprints"].helpers({
    ManageBlueprintsComponent(): any {
        return ManageBlueprintsComponent;
    }
});
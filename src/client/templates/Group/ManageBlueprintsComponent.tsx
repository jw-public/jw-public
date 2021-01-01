import { Template } from "meteor/templating";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Meteor } from "meteor/meteor";

//import { AutoForm, AutoField, TextField, SubmitField, HiddenField } from 'uniforms-bootstrap3';

import { WeekBlueprintSchema, Blueprints } from "../../../collections/lib/BlueprintCollection"
import { WeekBlueprint } from "../../../imports/blueprint/interfaces/WeekBlueprint";



export class ManageBlueprintsComponent extends React.Component<{}, {}> {

    private onSubmit(data: WeekBlueprint) {
        console.log(JSON.stringify(data));
        Blueprints.insert(data);
    }

    private getGroupId(): string {
        return FlowRouter.getParam("groupId");
    }

    public render(): JSX.Element {
        // return (
        //     <AutoForm
        //         schema={WeekBlueprintSchema}
        //         onSubmit={this.onSubmit}
        //     >
        //         <h2>Wochenschablone</h2>

        //         <AutoField name="name" />
        //         <HiddenField name="group" value={this.getGroupId()} />


        //         <div className="super-special-class">
        //             <SubmitField className="super-special-class-with-suffix" />
        //         </div>
        //     </AutoForm>
        // );
        return (
            <div>Not implemented</div>
        )
    }
}




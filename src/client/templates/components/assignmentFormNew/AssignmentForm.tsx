import * as React from "react";
import * as ReactDOM from "react-dom";

import { AutoForm } from 'uniforms-bootstrap3';

import { WeekBlueprintSchema } from "../../../../collections/lib/BlueprintCollection"

export class SimpleForm extends React.Component<{}, {}> {

    public render(): JSX.Element {
        return (
            <AutoForm
                schema={WeekBlueprintSchema}
                onSubmit={(data) => console.log(data)}
            />
        );

    }
}

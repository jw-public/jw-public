import { AssignmentDAO } from './../../../collections/lib/AssignmentsCollection';
import { WeekBlueprint } from './../../../imports/blueprint/interfaces/WeekBlueprint.d';

export interface IBlueprintMaterializer {
    materialize(blueprint: WeekBlueprint, options: BlueprintMaterializerOptions): Array<AssignmentDAO>;
}

export interface BlueprintMaterializerOptions {
    contacts: Array<string>;
    weekOfGivenDate: Date;
}
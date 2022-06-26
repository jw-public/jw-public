import { AssignmentDAO } from 'collections/lib/AssignmentsCollection';
import { WeekBlueprint } from 'imports/blueprint/interfaces/WeekBlueprint.d';
import { BlueprintAssignmentDAO } from './../../../imports/blueprint/interfaces/WeekBlueprint.d';
import { Logger } from './../../../imports/logging/Logger.d';
import { BlueprintMaterializerOptions, IBlueprintMaterializer } from './../interfaces/IBlueprintMaterializer';

import { LoggerFactory } from 'imports/logging/LoggerFactory';
import { inject, injectable } from "inversify";
import * as moment from 'moment';
import { Types } from "../../Types";

@injectable()
export class BlueprintMaterializer implements IBlueprintMaterializer {
    private logger: Logger;

    public constructor(@inject(Types.LoggerFactory) loggerFactory: LoggerFactory) {
        this.logger = loggerFactory.createLogger("BlueprintMaterializer");
    }

    public materialize(blueprint: WeekBlueprint, options: BlueprintMaterializerOptions): Array<AssignmentDAO> {
        let result = new Array<AssignmentDAO>();

        blueprint.assignments.forEach(element => {
            let singleAssignment: AssignmentDAO = this.processSingleAssignment(element, options, blueprint.group);
            result.push(singleAssignment)
        });

        return result;

    }

    private processSingleAssignment(element: BlueprintAssignmentDAO, options: BlueprintMaterializerOptions, group: string) {
        let startDate = moment(options.weekOfGivenDate).isoWeekday(element.isoWeekday).hour(element.startHour).minutes(element.startMinute);
        let endDate = moment(startDate).add("minute", element.durationMinutes);

        return {
            name: element.name,
            pickup_point: element.pickup_point,
            return_point: element.return_point,
            note: element.note,
            userGoal: element.userGoal,
            start: startDate.toDate(),
            end: endDate.toDate(),
            group: group,
            contacts: options.contacts
        };
    }
}


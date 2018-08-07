import { AssignmentDAO } from './../../collections/lib/AssignmentsCollection';
import { JsnLogFactory } from './../../imports/logging/JsnLogFactory';
import { WeekBlueprint, BlueprintAssignmentDAO } from './../../imports/blueprint/interfaces/WeekBlueprint.d';
import { BlueprintMaterializer } from './../../server/blueprint/classes/BlueprintMaterializer';
import { Types } from "../../server/Types";
import { assert } from "chai";

import * as TypeMoq from "typemoq";

import { injectable, inject, Kernel, interfaces } from "inversify";
import * as moment from 'moment';
import { SimpleConsoleLoggerFactory } from '../../imports/logging/SimpleConsoleLoggerFactory';

let loggerFactory = new SimpleConsoleLoggerFactory()

describe("BlueprintMaterializer", function () {

    it("should not be null or undefined", function () {
        let sut = new BlueprintMaterializer(loggerFactory)

        assert.isNotNull(sut)
        assert.isDefined(sut)
    });

    it("should materialize a blueprint", function () {
        // ARRANGE

        function createSingleBlueprint(isoWeekday: number, id: number): BlueprintAssignmentDAO {
            return {
                name: "Sample assignment #" + id,
                startHour: 12,
                startMinute: 15,
                durationMinutes: 120,
                isoWeekday,
                pickup_point: "Saal",
                return_point: "Saal auch",
                note: "This is some note",
                userGoal: 5
            };
        }

        let singleBlueprints: Array<BlueprintAssignmentDAO> = []

        // Creating seven assignment blueprints
        for (let i = 0; i < 7; i++) {
            singleBlueprints.push(createSingleBlueprint(i + 1, i + 1));
        }

        let input: WeekBlueprint = {
            name: "Sample Blueprint",
            group: "someGroupId",
            assignments: singleBlueprints
        };

        let sut = new BlueprintMaterializer(loggerFactory)

        // ACT
        let result: Array<AssignmentDAO> = sut.materialize(
            input,
            {
                weekOfGivenDate: moment("01-01-2017").toDate(),
                contacts: ["someContactId"]
            }
        );

        // ASSERT
        assert.isArray(result);
        assert.lengthOf(result, 7);

        let singleAssignment = result[2]; // We pick wednesday
        let singleBlueprint = singleBlueprints[2];
        assert.equal(singleAssignment.name, singleBlueprint.name);
        assert.equal(singleAssignment.pickup_point, singleBlueprint.pickup_point);
        assert.equal(singleAssignment.return_point, singleBlueprint.return_point);
        assert.equal(singleAssignment.note, singleBlueprint.note);
        assert.equal(singleAssignment.userGoal, singleBlueprint.userGoal);
        assert.equal(singleAssignment.group, "someGroupId");
        assert.deepEqual(singleAssignment.contacts, ["someContactId"]);



        let start = moment(singleAssignment.start)
        let end = moment(singleAssignment.end)
        assert.equal(start.isoWeekday(), 3, "ISO Weekday is not correct") // ISO Weekday
        assert.equal(start.format(), "2016-12-28T" + "12:15:00" + "+00:00", "Start time is not correct")
        assert.equal(end.format(), "2016-12-28T" + "14:15:00" + "+00:00", "End time is not correct")

    });


});

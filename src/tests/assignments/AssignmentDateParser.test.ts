import { Types } from "../../server/Types";
import { AssignmentServiceTypes } from "../../server/assignments/AssignmentServiceTypes";

import { AssignmentEventType } from "../../imports/assignments/interfaces/AssignmentEventType";
import { IAssignmentSingleNotifierOptions } from "../../server/assignments/interfaces/IAssignmentNotifier";
import { UserEntry, AssignmentDAO } from "../../collections/lib/AssignmentsCollection";
import { AssignmentTestCaseWithNotifications } from "./common/AssignmentTestCaseWithNotifications";

import { assert } from "chai";

import { IAssignmentDateParser } from "../../server/assignments/interfaces/IAssignmentDateParser";

import * as lolex from 'lolex';

describe("AssignmentDateParser", function () {
    let lolexHandle: lolex.Clock;
    beforeEach(function () {
        lolexHandle = lolex.install();
    });


    it("should not be null or undefined", function () {
        // Arrange
        let testCase = new AssignmentDateParserTestCase();

        // Act

        // Assert
        assert.isDefined(testCase.dateParser);
        assert.isNotNull(testCase.dateParser);
    });

    it("should read correct start date for German summertime when in German summertime", function () {
        // Arrange
        let testCase = new AssignmentDateParserTestCase();
        lolexHandle.setSystemTime(new Date("2016-06-06T12:00:00Z"));
        // Act
        let date = testCase.dateParser.getStartDate({
            start: new Date("2016-10-24T13:00:00Z")
        });
        // Assert
        assertDateIs(date, "Mo., 24. Okt. 2016 15:00");
    });


    it("should read correct start date for German summertime when in German wintertime", function () {
        // Arrange
        let testCase = new AssignmentDateParserTestCase();
        lolexHandle.setSystemTime(new Date("2016-11-03T09:00:00Z"));
        // Act
        let date = testCase.dateParser.getStartDate({
            start: new Date("2016-10-24T13:00:00Z")
        });
        // Assert
        assertDateIs(date, "Mo., 24. Okt. 2016 15:00");
    });

    it("should read correct start date for German wintertime when in German summertime", function () {
        // Arrange
        let testCase = new AssignmentDateParserTestCase();
        lolexHandle.setSystemTime(new Date("2016-06-06T12:00:00Z"));
        // Act
        let date = testCase.dateParser.getStartDate({
            start: new Date("2016-11-04T09:00:00Z")
        });
        // Assert
        assertDateIs(date, "Fr., 4. Nov. 2016 10:00");
    });


    it("should read correct start date for German wintertime when in German wintertime", function () {
        // Arrange
        let testCase = new AssignmentDateParserTestCase();
        lolexHandle.setSystemTime(new Date("2016-11-03T09:00:00Z"));
        // Act
        let date = testCase.dateParser.getStartDate({
            start: new Date("2016-11-04T09:00:00Z")
        });
        // Assert
        assertDateIs(date, "Fr., 4. Nov. 2016 10:00");
    });


    it("should read correct start date for German wintertime when in German summertime + 20 years", function () {
        // Arrange
        let testCase = new AssignmentDateParserTestCase();
        lolexHandle.setSystemTime(new Date("2016-06-06T12:00:00Z"));
        // Act
        let date = testCase.dateParser.getStartDate({
            start: new Date("2036-11-04T09:00:00Z")
        });
        // Assert
        assertDateIs(date, "Di., 4. Nov. 2036 10:00");
    });


    afterEach(function () {
        lolexHandle.uninstall();
    });

});

const assertDateIs = function (date: moment.Moment, expectedDate: string) {
    date.locale("de");
    assert.equal(date.format("llll"), expectedDate);
}

class AssignmentDateParserTestCase extends AssignmentTestCaseWithNotifications<IAssignmentDateParser> {
    private _dateParser: IAssignmentDateParser = null;

    constructor() {
        super(AssignmentServiceTypes.IAssignmentDateParser);
        this._dateParser = this.getTestObject();
    }

    get dateParser(): IAssignmentDateParser {
        return this._dateParser;
    }

}

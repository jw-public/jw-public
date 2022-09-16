import * as chai from "chai";
import * as lolex from 'lolex';
import { AssignmentCopyActionDAO } from "../../collections/lib/AssignmentCopyActionsCollection";
import { AssignmentDAO } from '../../collections/lib/AssignmentsCollection';
import { AssignmentState } from "../../collections/lib/classes/AssignmentState";
import { JsnLogFactory } from '../../imports/logging/JsnLogFactory';
import { AssignmentWeekCopyPaster } from '../../server/assignments/classes/AssignmentWeekCopyPaster';
import { LocalCollection } from '../3rdParty/minimongo-standalone/minimongo-standalone';

describe("AssignmentWeekCopyPaster.copyPasteCalendarWeek()", function () {
  let lolexHandle: lolex.Clock;
  beforeEach(function () {
    lolexHandle = lolex.install();
  });


  afterEach(function () {
    lolexHandle.reset();
  });

  it("should be able to copy one assignment", function () {
    // Arrange
    const systemTimeNow = new Date("2035-10-24T12:00:00.000+02:00")
    lolexHandle.setSystemTime(systemTimeNow);
    const fixtureCollection = new LocalCollection<AssignmentDAO>("assignments");
    const copyActionsCollection = new LocalCollection<AssignmentCopyActionDAO>("copyActionsCollection");
    const toBeTested = new AssignmentWeekCopyPaster(fixtureCollection, copyActionsCollection, new JsnLogFactory())


    const original: AssignmentDAO = {
      name: "A",
      start: new Date("2022-01-03T12:00:00.000+01:00"),
      end: new Date("2022-01-03T14:00:00.000+01:00"),
      userGoal: 2,
      isoWeek: 1,
      yearOfIsoWeek: 2022,
      pickup_point: "pickup A",
      return_point: "return A",
      participants: [{
        user: "dummy1"
      }, {
        user: "dummy2"
      }],
      applicants: [{
        user: "dummy3"
      }, {
        user: "dummy4"
      }],
      stateBeforeLastClose: AssignmentState[AssignmentState.Canceled],
      state: AssignmentState[AssignmentState.Closed],
      note: "someNote",
      group: "group_id",
      cancelationReason: "reason",
      contacts: ["brotherA", "brotherB"]
    }
    fixtureCollection.insert(original)

    // insert modified one from a different group
    const fromAnotherGroup: AssignmentDAO = { ...original, group: "another_group" }
    fixtureCollection.insert(fromAnotherGroup)

    // Act
    const totalCopied = toBeTested.copyPasteCalendarWeekInGroup({
      groupId: original.group,
      from: {
        calendarWeek: 1,
        year: 2022
      },
      to: {
        calendarWeek: 2,
        year: 2023
      }
    })
    // Assert
    chai.assert.equal(fixtureCollection.find().count(), 3) // original + fromAnotherGroup + copied
    chai.assert.equal(copyActionsCollection.find().count(), 1)
    chai.assert.equal(totalCopied, 1)

    const result = fixtureCollection.findOne({
      isoWeek: 2,
    })
    const copyAction = copyActionsCollection.findOne()

    // calculate correct date
    chai.assert.strictEqual(result.yearOfIsoWeek, 2023)
    chai.assert.strictEqual(result.start.toISOString(), new Date("2023-01-09T12:00:00.000+01:00").toISOString())
    chai.assert.strictEqual(result.end.toISOString(), new Date("2023-01-09T14:00:00.000+01:00").toISOString())

    // link correct copy action
    chai.assert.strictEqual(result.copyActionId, copyAction._id)

    // copy static fields
    chai.assert.strictEqual(result.name, original.name)
    chai.assert.strictEqual(result.userGoal, original.userGoal)
    chai.assert.strictEqual(result.pickup_point, original.pickup_point)
    chai.assert.strictEqual(result.return_point, original.return_point)
    chai.assert.strictEqual(result.note, original.note)
    chai.assert.strictEqual(result.group, original.group)
    chai.assert.deepEqual(result.contacts, original.contacts)

    // reset dynamic fields
    chai.assert.lengthOf(result.participants, 0, "Participants must not be copied")
    chai.assert.lengthOf(result.applicants, 0, "Applicants must not be copied")
    chai.assert.isUndefined(result.stateBeforeLastClose, "stateBeforeLastClose must not be copied")
    chai.assert.isUndefined(result.cancelationReason, "cancelationReason must not be copied")
    chai.assert.isUndefined(result.updatedAt, "updatedAt must not be copied")
    chai.assert.isUndefined(result.createdAt, "createdAt must not be copied")
    chai.assert.strictEqual(result.state, AssignmentState[AssignmentState.Online])

    // check copy action
    chai.assert.strictEqual(copyAction.executedDate.toISOString(), systemTimeNow.toISOString())
    chai.assert.strictEqual(copyAction.totalCopied, 1)
    chai.assert.strictEqual(copyAction.group, original.group)
    chai.assert.strictEqual(copyAction.fromIsoWeek, original.isoWeek)
    chai.assert.strictEqual(copyAction.fromYearOfIsoWeek, original.yearOfIsoWeek)
    chai.assert.strictEqual(copyAction.toIsoWeek, result.isoWeek)
    chai.assert.strictEqual(copyAction.toYearOfIsoWeek, result.yearOfIsoWeek)
  });

  it("should be able to copy one assignment", function () {
    // Arrange
    const systemTimeNow = new Date("2035-10-24T12:00:00.000+02:00")
    lolexHandle.setSystemTime(systemTimeNow);
    const fixtureCollection = new LocalCollection<AssignmentDAO>("assignments");
    const copyActionsCollection = new LocalCollection<AssignmentCopyActionDAO>("copyActionsCollection");
    const toBeTested = new AssignmentWeekCopyPaster(fixtureCollection, copyActionsCollection, new JsnLogFactory())


    const original: AssignmentDAO = {
      name: "A",
      start: new Date("2022-06-06T12:00:00.000+02:00"),
      end: new Date("2022-06-06T14:00:00.000+02:00"),
      userGoal: 2,
      isoWeek: 23,
      yearOfIsoWeek: 2022,
      pickup_point: "pickup A",
      return_point: "return A",
      participants: [{
        user: "dummy1"
      }, {
        user: "dummy2"
      }],
      applicants: [{
        user: "dummy3"
      }, {
        user: "dummy4"
      }],
      stateBeforeLastClose: AssignmentState[AssignmentState.Canceled],
      state: AssignmentState[AssignmentState.Closed],
      note: "someNote",
      group: "group_id",
      cancelationReason: "reason",
      contacts: ["brotherA", "brotherB"]
    }
    fixtureCollection.insert(original)

    // Act
    const totalCopied = toBeTested.copyPasteCalendarWeekInGroup({
      groupId: original.group,
      from: {
        calendarWeek: 23,
        year: 2022
      },
      to: {
        calendarWeek: 2,
        year: 2023
      }
    })

    const result = fixtureCollection.findOne({
      isoWeek: 2,
      yearOfIsoWeek: 2023
    })
    const copyAction = copyActionsCollection.findOne()

    // calculate correct date
    chai.assert.strictEqual(result.yearOfIsoWeek, 2023)
    chai.assert.strictEqual(result.start.toISOString(), new Date("2023-01-09T12:00:00.000+01:00").toISOString())
    chai.assert.strictEqual(result.end.toISOString(), new Date("2023-01-09T14:00:00.000+01:00").toISOString())

    // check copy action
    chai.assert.strictEqual(copyAction.executedDate.toISOString(), systemTimeNow.toISOString())
    chai.assert.strictEqual(copyAction.totalCopied, 1)
    chai.assert.strictEqual(copyAction.group, original.group)
    chai.assert.strictEqual(copyAction.fromIsoWeek, original.isoWeek)
    chai.assert.strictEqual(copyAction.fromYearOfIsoWeek, original.yearOfIsoWeek)
    chai.assert.strictEqual(copyAction.toIsoWeek, result.isoWeek)
    chai.assert.strictEqual(copyAction.toYearOfIsoWeek, result.yearOfIsoWeek)
  });
});

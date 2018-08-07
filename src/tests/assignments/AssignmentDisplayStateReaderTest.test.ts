import {AssignmentDisplayStateReader} from "../../lib/classes/AssignmentDisplayStateReader";
import { DisplayState, IAssignmentDisplayStateReader} from "../../lib/classes/AssignmentDisplayStateReader";
import { IAssignmentStateReader, AssignmentStateForUser} from "../../lib/classes/AssignmentStateReader";
import * as _ from "underscore";
import * as chai from "chai";


describe("AssignmentDisplayStateReader UnitTest", function() {

  it("State Default", function() {
    assertDisplayStateOf(defaultState).is(DisplayState.Default);
  });

  it("State Canceled, if closed", function() {
    assertDisplayStateOf({
      closed: false,
      canceled: true,
      participant: false,
      applicant: false,
    }).is(DisplayState.Canceled);
  });

  it("State Canceled, if closed and participant", function() {
    assertDisplayStateOf({
      closed: true,
      canceled: true,
      participant: true,
      applicant: false,
    }).is(DisplayState.Canceled);
  });

  it("State Canceled, if not closed and participant", function() {
    assertDisplayStateOf({
      closed: false,
      canceled: true,
      participant: true,
      applicant: false,
    }).is(DisplayState.Canceled);
  });

  it("State Canceled, if not closed and applicant", function() {
    assertDisplayStateOf({
      closed: false,
      canceled: true,
      participant: false,
      applicant: true,
    }).is(DisplayState.Canceled);
  });

  it("State Canceled, if not closed", function() {
    assertDisplayStateOf({
      closed: false,
      canceled: true,
      participant: false,
      applicant: false,
    }).is(DisplayState.Canceled);
  });

  it("State Closed, when not participant and not applicant", function() {
    assertDisplayStateOf({
      closed: true,
      canceled: false,
      participant: false,
      applicant: false
    }).is(DisplayState.Closed);
  });

  it("State Closed, when not participant but is applicant", function() {
    assertDisplayStateOf({
      closed: true,
      canceled: false,
      participant: false,
      applicant: true
    }).is(DisplayState.Closed);
  });

  it("State UserAccepted, when participant and closed", function() {
    assertDisplayStateOf({
      closed: true,
      canceled: false,
      participant: true,
      applicant: false
    }).is(DisplayState.UserAccepted);
  });

  it("State UserAccepted, when participant and not closed", function() {
    assertDisplayStateOf({
      closed: false,
      canceled: false,
      participant: true,
      applicant: false
    }).is(DisplayState.UserAccepted);
  });

  it("State UserApplicant, when applicant and not closed", function() {
    assertDisplayStateOf({
      closed: false,
      canceled: false,
      participant: false,
      applicant: true
    }).is(DisplayState.UserApplicant);
  });

});

interface TestState {
  closed: boolean;
  canceled: boolean;
  participant: boolean;
  applicant: boolean;
}


const defaultState: TestState = {
  closed: false,
  canceled: false,
  participant: false,
  applicant: false,
};


function wrapTestState(testState: TestState): IAssignmentStateReader {
  return {
    isClosed() { return testState.closed; },
    isCanceled() { return testState.canceled; },
    isParticipantById(userId: string) { return testState.participant; },
    isApplicantById(userId: string) { return testState.applicant; },
    getAssignmentState(userId: string): AssignmentStateForUser {
      return {
        canceled: testState.canceled,
        closed: testState.closed,
        isParticipant: testState.participant,
        isApplicant: testState.applicant,
      };
    }

  };
}



function getSystemUnderTestWith(assignmentState: TestState): IAssignmentDisplayStateReader {
  return AssignmentDisplayStateReader.fromAssignmentStateReader(wrapTestState(assignmentState)).withUserId("ThisIsARandomUserID");
}

function assertDisplayStateEquals(actual: DisplayState, expected: DisplayState) {
  chai.assert.equal(actual, expected, "Should be " + DisplayState[expected] + ", but was " + DisplayState[actual]);
}

function assertDisplayStateOf(testState: TestState) {

  let systemUnderTest = getSystemUnderTestWith(testState);

  return {
    is(displayState: DisplayState) {
      let state = systemUnderTest.getDisplayState();
      assertDisplayStateEquals(state, displayState);
    }
  };
}

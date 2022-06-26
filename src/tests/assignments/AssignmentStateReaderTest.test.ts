import { AssignmentDAO, UserEntry } from "../../collections/lib/AssignmentsCollection";

import * as chai from "chai";
import * as _ from "underscore";
import { AssignmentState } from "../../collections/lib/classes/AssignmentState";
import { AssignmentStateForUser, AssignmentStateReader } from "../../lib/classes/AssignmentStateReader";



describe("AssignmentStateReader UnitTest", function () {

  it("Empty and closed assignment", function () {
    assertAssignment({
      participants: [],
      applicants: [],
      state: AssignmentState.Closed
    }).forRandomUser().hasState({
      canceled: false,
      closed: true,
      isParticipant: false,
      isApplicant: false,
    });
  });

  it("User is participant and closed assignment", function () {
    assertAssignment({
      participants: ["fioashbdfioasbofb", randomUser, "goujanrpogbüobgng"],
      applicants: [],
      state: AssignmentState.Closed
    }).forRandomUser().hasState({
      canceled: false,
      closed: true,
      isParticipant: true,
      isApplicant: false,
    });
  });

  it("User is applicant and open assignment", function () {
    assertAssignment({
      applicants: ["fioashbdfioasbofb", randomUser, "goujanrpogbüobgng"],
      participants: ["donfonsdanobndfdsf"],
      state: AssignmentState.Online
    }).forRandomUser().hasState({
      canceled: false,
      closed: false,
      isParticipant: false,
      isApplicant: true,
    });
  });

  it("Canceled assignment", function () {
    assertAssignment({
      applicants: [],
      participants: [],
      state: AssignmentState.Canceled
    }).forRandomUser().hasState({
      canceled: true,
      closed: false,
      isParticipant: false,
      isApplicant: false,
    });
  });

});

interface SimpleAssignment {
  applicants: Array<string>;
  participants: Array<string>;
  state: AssignmentState;
}


const randomUser = "fifb83bf2bp9u2b39w4twzbg";


function getAssertMessage(assignment: AssignmentDAO, actualState: Object, expectedState: Object) {
  return `State of assignment ${JSON.stringify(assignment)}
        should be ${JSON.stringify(expectedState)}
        but was ${JSON.stringify(actualState)}`;
}

function mapToUserEntries(userIds: Array<string>): Array<UserEntry> {
  return _.map<string, UserEntry>(userIds, (userId) => {
    return { user: userId, when: new Date() };
  });
}

function assertAssignment(simpleAssignment: SimpleAssignment) {

  let assignment: AssignmentDAO = {
    state: AssignmentState[simpleAssignment.state],
    participants: mapToUserEntries(simpleAssignment.participants),
    applicants: mapToUserEntries(simpleAssignment.applicants)
  };

  let systemUnderTest = AssignmentStateReader.fromAssignmentDAO(assignment);


  return {
    forRandomUser() {
      return {
        hasState(expected: AssignmentStateForUser) {
          let assignmentState = systemUnderTest.getAssignmentState(randomUser);
          chai.assert.deepEqual(assignmentState, expected, getAssertMessage(assignment, assignmentState, expected));
        }
      };
    }
  };
}

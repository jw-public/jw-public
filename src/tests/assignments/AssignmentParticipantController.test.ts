import { AssignmentDAO } from '../../collections/lib/AssignmentsCollection';
import { SimpleCollection } from '../../imports/interfaces/SimpleCollection';
import { AssignmentServiceTypes } from '../../server/assignments/AssignmentServiceTypes';
import { IAssignmentContext } from '../../server/assignments/interfaces/IAssignmentContext';
import {
  IAssignmentParticipantController
} from '../../server/assignments/interfaces/IAssignmentParticipantController';
import {
  IAssignmentParticipantControllerFactory
} from '../../server/assignments/interfaces/IAssignmentParticipantControllerFactory';
import {
  IAssignmentParticipationNotifier
} from '../../server/assignments/interfaces/IAssignmentParticipationNotifier';
import { Types } from '../../server/Types';
import { AssignmentParticipationNotifierMock } from './common/AssignmentParticipationNotifierMock';
import { AssignmentTestCaseWithNotifications } from './common/AssignmentTestCaseWithNotifications';

import { assert } from "chai";



describe("AssignmentParticipantController.addUserAsParticipantAndNotify()", function () {

  it("should be able to add a user as participant, when no other user is applicant or participant", function () {
    // Arrange
    let addUserTestCase = new AddUserTestCase({
      initialAssignment:
      {
        applicants: [],
        participants: []
      }
    });

    // Act
    let appliedChanges = addUserTestCase.executeWith(testData.userId);

    // Assert
    let assignmentAssert = addUserTestCase.assignmentAssert;
    assignmentAssert.participantCountIs(1, "No user was appended to participants");
    assignmentAssert.containsUserIdInParticipants(testData.userId);
    assert.isTrue(appliedChanges, "Method shall indicate change")

  });

  it("should be able to add a user as participant, when user is applicant. Also removes applicant.", function () {
    // Arrange
    let addUserTestCase = new AddUserTestCase({
      initialAssignment:
      {
        applicants: [{
          user: testData.userId
        }],
        participants: []
      }
    });

    // Act
    let appliedChanges = addUserTestCase.executeWith(testData.userId);

    // Assert
    let assignmentAssert = addUserTestCase.assignmentAssert;

    assignmentAssert.participantCountIs(1, "No user was appended to participants");
    assignmentAssert.containsUserIdInParticipants(testData.userId);
    assignmentAssert.applicantCountIs(0, "User was not removed from applicants");
    assert.isTrue(appliedChanges, "Method shall indicate change")

  });

  it("should not add participant twice", function () {
    // Arrange
    let addUserTestCase = new AddUserTestCase({
      initialAssignment:
      {
        participants: [{
          user: testData.userId
        }],
        applicants: []
      }
    });

    // Act
    let appliedChanges = addUserTestCase.executeWith(testData.userId);

    // Assert
    let assignmentAssert = addUserTestCase.assignmentAssert;

    assignmentAssert.participantCountIs(1, "User was appended more than once to participants");
    assignmentAssert.containsUserIdInParticipants(testData.userId);
    addUserTestCase.notifierMock.assertNoUserWasNotifiedAboutAccepted();
    assert.isFalse(appliedChanges, "Method shall indicate no change")
  });

  it("should notify user, when adding as participant", function () {
    // Arrange
    let addUserTestCase = new AddUserTestCase({
      initialAssignment:
      {
        participants: [],
        applicants: []
      }
    });

    // Act
    addUserTestCase.executeWith(testData.userId);

    // Assert
    let assignmentAssert = addUserTestCase.assignmentAssert;

    assignmentAssert.containsUserIdInParticipants(testData.userId);
    addUserTestCase.notifierMock.assertUserWasNotifiedAboutAccepted(testData.userId);

  });


});



describe("AssignmentParticipantController.removeUserAsParticipantAndNotify()", function () {

  it("should be able to remove a user from participants and user is notified", function () {
    // Arrange
    let removeUserTestCase = new RemoveUserTestCase({
      initialAssignment:
      {
        participants: [{
          user: testData.userId
        }],
        applicants: []
      }
    });

    // Act
    let appliedChanges = removeUserTestCase.executeWith(testData.userId);

    // Assert
    let assignmentAssert = removeUserTestCase.assignmentAssert;

    assignmentAssert.participantCountIs(0, "No user was removed from participants");
    removeUserTestCase.notifierMock.assertUserWasNotifiedAboutRemoval(testData.userId);
    assert.isTrue(appliedChanges, "Method shall indicate change");

  });

  it("should not throw an error if already not an participant", function () {
    // Arrange
    let removeUserTestCase = new RemoveUserTestCase({
      initialAssignment:
      {
        participants: [{
          user: "Some-other-user"
        }],
        applicants: []
      }
    });

    // Act
    let appliedChanges = removeUserTestCase.executeWith(testData.userId);

    // Assert
    let assignmentAssert = removeUserTestCase.assignmentAssert;

    assignmentAssert.participantCountIs(1, "Deleted the wrong one");
    assignmentAssert.containsUserIdInParticipants("Some-other-user");
    assert.isFalse(appliedChanges, "Method shall indicate no change");
    removeUserTestCase.notifierMock.assertNoUserWasNotifiedAboutRemoved();

  });





});



const testData = {
  userId: "thisIsSomeRandomUserId814691",
}




interface ApplicationControllerTestData {
  initialAssignment: AssignmentDAO
}

class AssignmentParticipantControllerTestCase extends AssignmentTestCaseWithNotifications<IAssignmentParticipantControllerFactory> implements IAssignmentContext {
  public participantController: IAssignmentParticipantController;
  private _notifier: AssignmentParticipationNotifierMock;

  constructor(private testData: ApplicationControllerTestData) {
    super(Types.IAssignmentParticipantControllerFactory);


    this._notifier = new AssignmentParticipationNotifierMock(this);

    this.replace<IAssignmentParticipationNotifier>(
      {
        type: AssignmentServiceTypes.IAssignmentParticipationNotifier,
        alternative: this._notifier
      });



    this.participantController = this.createParticipantControllerWithAssignment(this.getTestObject());


  }

  public getAssignmentId() {
    return this.assignment._id;
  }

  get assignment(): AssignmentDAO {
    return this.collection.findOne();
  }



  get assignmentAssert() {
    return this.assert(this.assignment);
  }

  get notifierMock(): AssignmentParticipationNotifierMock {
    return this._notifier;
  }

  private createParticipantControllerWithAssignment(controllerFactory: IAssignmentParticipantControllerFactory) {
    let assignmentContext = insertAnAssignmentIntoCollection(this.collection, this.testData.initialAssignment);
    let participantController = controllerFactory(assignmentContext.getAssignmentId());
    return participantController;
  }

}

class AddUserTestCase extends AssignmentParticipantControllerTestCase {

  public executeWith(userId: string): boolean {
    return this.participantController.addUserAsParticipantAndNotify(userId);
  }

}

class RemoveUserTestCase extends AssignmentParticipantControllerTestCase {

  public executeWith(userId: string): boolean {
    return this.participantController.removeUserAsParticipantAndNotify(userId);
  }

}


function insertAnAssignmentIntoCollection(collection: SimpleCollection<AssignmentDAO>, assignment: AssignmentDAO): IAssignmentContext {
  let assignmentId = collection.insert(assignment);

  return {
    getAssignmentId: () => {
      return assignmentId;
    }
  };
}

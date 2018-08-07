import { AssignmentDAO } from '../../collections/lib/AssignmentsCollection';
import { SimpleCollection } from '../../imports/interfaces/SimpleCollection';
import {
  IAssignmentApplicationController
} from '../../server/assignments/interfaces/IAssignmentApplicationController';
import {
  IAssignmentApplicationControllerFactory
} from '../../server/assignments/interfaces/IAssignmentApplicationControllerFactory';
import { IAssignmentContext } from '../../server/assignments/interfaces/IAssignmentContext';
import { Types } from '../../server/Types';
import { AssignmentTestCaseWithNotifications } from './common/AssignmentTestCaseWithNotifications';






describe("AssignmentApplicationController.addUserAsApplicantById()", function () {

  it("should be able to add a user as applicant, when no other user is applicant", function () {
    // Arrange
    let addUserTestCase = new AddUserTestCase({
      initialAssignment:
      {
        applicants: []
      }
    });

    // Act
    addUserTestCase.executeWith(testData.userId);

    // Assert
    let assignmentAssert = addUserTestCase.assignmentAssert;

    assignmentAssert.applicantCountIs(1, "No user was appended to applicants");
    assignmentAssert.containsUserIdInApplicants(testData.userId, "A wrong user id was appended");

  });

  it("should be able to add a user as applicant, when other users are already applicants", function () {
    // Arrange
    let addUserTestCase = new AddUserTestCase({
      initialAssignment:
      {
        applicants: [
          {
            user: "thisIsSomeOtherGuy"
          }
        ]
      }
    });

    // Act
    addUserTestCase.executeWith(testData.userId);

    // Assert
    let assignmentAssert = addUserTestCase.assignmentAssert;

    assignmentAssert.applicantCountIs(2, "The given user was not correctly appended to the applicant entries.");
    assignmentAssert.containsUserIdInApplicants(testData.userId, "A wrong user id was appended");
    assignmentAssert.containsUserIdInApplicants("thisIsSomeOtherGuy");
  });

  it("should not add a user if already an applicant", function () {

    // Arrange
    let addUserTestCase = new AddUserTestCase({
      initialAssignment:
      {
        applicants: [
          {
            user: testData.userId
          }
        ]
      }
    });

    // Act
    addUserTestCase.executeWith(testData.userId);

    // Assert
    let assignmentAssert = addUserTestCase.assignmentAssert;

    assignmentAssert.applicantCountIs(1, "The given user is incorrectly added multiple times.");
    assignmentAssert.containsUserIdInApplicants(testData.userId);
  });

  it("should not add a user if already an participant", function () {
    // Arrange
    let addUserTestCase = new AddUserTestCase({
      initialAssignment: {
        applicants: [],
        participants: [
          {
            user: testData.userId
          }
        ]
      }
    });

    // Act
    addUserTestCase.executeWith(testData.userId);

    // Assert
    let assignmentAssert = addUserTestCase.assignmentAssert;

    assignmentAssert.applicantCountIs(0, "The given user should not be an applicant.");
    assignmentAssert.participantCountIs(1, "The given user should still be an participant.");
    assignmentAssert.containsUserIdInParticipants(testData.userId);
  });



});


describe("AssignmentApplicationController.removeUserAsApplicantById()", function () {

  it("should do nothing, when trying to remove applicant when user is no applicant", function () {
    // Arrange
    let removeUserTestCase = new RemoveUserTestCase({
      initialAssignment:
      {
        applicants: [{
          user: "thisIsSomeOtherGuy"
        }]
      }
    });

    // Act
    removeUserTestCase.executeWith(testData.userId);

    // Assert
    let assignmentAssert = removeUserTestCase.assignmentAssert;

    assignmentAssert.applicantCountIs(1, "Obviously it removed the wrong one");
    assignmentAssert.containsUserIdInApplicants("thisIsSomeOtherGuy");

  });

  it("should remove user, when he is the only applicant", function () {
    // Arrange
    let removeUserTestCase = new RemoveUserTestCase({
      initialAssignment:
      {
        applicants: [{
          user: testData.userId
        }]
      }
    });

    // Act
    removeUserTestCase.executeWith(testData.userId);

    // Assert
    let assignmentAssert = removeUserTestCase.assignmentAssert;

    assignmentAssert.applicantCountIs(0, "The given user was not removed.");

  });

  it("should remove user, when there are other applicants", function () {
    // Arrange
    let removeUserTestCase = new RemoveUserTestCase({
      initialAssignment:
      {
        applicants: [{
          user: testData.userId
        },
        {
          user: "someOtherGuy"
        }
        ]
      }
    });

    // Act
    removeUserTestCase.executeWith(testData.userId);

    // Assert
    let assignmentAssert = removeUserTestCase.assignmentAssert;

    assignmentAssert.containsUserIdInApplicants("someOtherGuy", "We deleted the wrong one.");
    assignmentAssert.applicantCountIs(1, "The given user was not removed.");

  });


});


const testData = {
  userId: "thisIsSomeRandomUserId814691",
}


interface ApplicationControllerTestData {
  initialAssignment: AssignmentDAO
}

class AssignmentApplicationTestCase extends AssignmentTestCaseWithNotifications<IAssignmentApplicationControllerFactory>{
  public applicationController: IAssignmentApplicationController;

  constructor(private testData: ApplicationControllerTestData) {
    super(Types.IAssignmentApplicationControllerFactory);

    this.applicationController = this.createApplicationControllerWithAssignment(this.getTestObject());
  }

  get assignment(): AssignmentDAO {
    return this.collection.findOne();
  }

  get assignmentAssert() {
    return this.assert(this.assignment);
  }


  private createApplicationControllerWithAssignment(controllerFactory: IAssignmentApplicationControllerFactory): IAssignmentApplicationController {
    let assignmentContext = insertAnAssignmentIntoCollection(this.collection, this.testData.initialAssignment);
    let applicationController: IAssignmentApplicationController = controllerFactory(assignmentContext.getAssignmentId());
    return applicationController;
  }

}

class AddUserTestCase extends AssignmentApplicationTestCase {

  public executeWith(userId: string) {
    this.applicationController.addUserAsApplicantById(userId);
  }

}

class RemoveUserTestCase extends AssignmentApplicationTestCase {

  public executeWith(userId: string) {
    this.applicationController.removeUserAsApplicantById(userId);
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

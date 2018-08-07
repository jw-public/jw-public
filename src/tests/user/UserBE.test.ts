import {Types} from "../../server/Types";
import {UserTypes} from "../../server/user/UserTypes";
import {IUserFactory} from "../../server/user/interfaces/IUserFactory";
import {IUserBE} from "../../server/user/interfaces/IUserBE";


import {assert} from "chai";

import * as TypeMoq from "typemoq";
import { injectable, inject, Kernel, interfaces } from "inversify";

import {TestCase} from "../common/TestCase";
import {UserDAO} from "../../collections/lib/UserCollection";




describe("UserBE", function() {

  it("should not be null or undefined", function() {
    // Arrange
    let testCase = new UserBETestCase({
      // Empty User
    });

    // Act


    // Assert
    assert.isDefined(testCase.user);
    assert.isNotNull(testCase.user);
  });

  it("should determine existing state of user", function() {
    // Arrange
    let testCase = new UserBETestCase({
      profile: {
        first_name: "Robert",
        last_name: "Furs"
      }
    });

    // Act


    // Assert
    assert.isTrue(testCase.user.exists());
    assert.isFalse(testCase.nonExistingUser.exists());
  });


  it("should determine correct E-Mail address", function() {
    // Arrange
    let testCase = new UserBETestCase({
      emails: [
        {
          address: "test@dummy.com",
          verified: false
        }
      ]
    });

    // Act


    // Assert
    assert.equal(testCase.user.getEmailAddress(), "test@dummy.com");
  });

});


class UserBETestCase extends TestCase<IUserFactory> {

  private userId: string;
  constructor(private userDao: UserDAO) {
    super(UserTypes.IUserFactory);

    this.userId = this.userCollection.insert(userDao);
  }

  public get user(): IUserBE {
    return this.getTestObject().createUser(this.userId);
  }

  public get nonExistingUser(): IUserBE {
    return this.getTestObject().createUser("nonExtistingUser");
  }

}

import { IUserBE } from "../../server/user/interfaces/IUserBE";
import { IUserFactory } from "../../server/user/interfaces/IUserFactory";
import { UserTypes } from "../../server/user/UserTypes";

import { assert } from "chai";

import { UserDAO } from "../../collections/lib/UserCollection";
import { TestCase } from "../common/TestCase";

describe("UserBE", function () {
  it("should not be null or undefined", async function () {
    // Arrange
    let testCase = new UserBETestCase({
      // Empty User
    });

    // Act

    // Assert
    assert.isDefined(await testCase.user);
    assert.isNotNull(await testCase.user);
  });

  it("should determine existing state of user", async function () {
    // Arrange
    let testCase = new UserBETestCase({
      profile: {
        first_name: "Robert",
        last_name: "Furs",
      },
    });

    // Act

    // Assert
    assert.isTrue((await testCase.user).exists());
    assert.isFalse((await testCase.nonExistingUser).exists());
  });

  it("should determine correct E-Mail address", async function () {
    // Arrange
    let testCase = new UserBETestCase({
      emails: [
        {
          address: "test@dummy.com",
          verified: false,
        },
      ],
    });

    // Act

    // Assert
    assert.equal((await testCase.user).getEmailAddress(), "test@dummy.com");
  });
});

class UserBETestCase extends TestCase<IUserFactory> {
  private userId: string;
  constructor(private userDao: UserDAO) {
    super(UserTypes.IUserFactory);

    this.userId = this.userCollection.insert(userDao);
  }

  public get user(): Promise<IUserBE> {
    return this.getTestObject().createUser(this.userId);
  }

  public get nonExistingUser(): Promise<IUserBE> {
    return this.getTestObject().createUser("nonExtistingUser");
  }
}

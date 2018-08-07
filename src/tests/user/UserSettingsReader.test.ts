import {Types} from "../../server/Types";
import {UserTypes} from "../../server/user/UserTypes";
import {IUserSettingsReaderFactory} from "../../server/user/interfaces/IUserSettingsReaderFactory";
import {IUserSettingsReader} from "../../server/user/interfaces/IUserSettingsReader";


import {assert} from "chai";

import * as TypeMoq from "typemoq";
import { injectable, inject, Kernel, interfaces } from "inversify";

import {TestCase} from "../common/TestCase";
import {UserDAO} from "../../collections/lib/UserCollection";




describe("UserSettingsReader", function() {

  it("should not be null or undefined", function() {
    // Arrange
    let testCase = new UserSettingsReaderTestCase({
      // Empty User
    });

    // Act


    // Assert
    assert.isDefined(testCase.reader);
    assert.isNotNull(testCase.reader);
  });


  it("should determine whether user wants to receive notification emails, when property is undefined", function() {
    // Arrange
    let testCase = new UserSettingsReaderTestCase({
      profile: {
      }
    });

    // Act

    // Assert
    assert.isTrue(testCase.reader.wantsToReceiveNotificationAsEmail());
  });

  it("should determine whether user wants to receive notification emails, when property is false", function() {
    // Arrange
    let testCase = new UserSettingsReaderTestCase({
      profile: {
        notificationAsEmail: false
      }
    });

    // Act

    // Assert
    assert.isFalse(testCase.reader.wantsToReceiveNotificationAsEmail());
  });

  it("should determine whether user wants to receive notification emails, when property is true", function() {
    // Arrange
    let testCase = new UserSettingsReaderTestCase({
      profile: {
        notificationAsEmail: true
      }
    });

    // Act

    // Assert
    assert.isTrue(testCase.reader.wantsToReceiveNotificationAsEmail());
  });

  it("should determine language when german", function() {
    // Arrange
    let testCase = new UserSettingsReaderTestCase({
      profile: {
        language: "de-de"
      }
    });

    // Act

    // Assert
    assert.equal(testCase.reader.getI18nProvider().getLanguageIdentifier(), "de-de");
  });

  it("should determine language when french", function() {
    // Arrange
    let testCase = new UserSettingsReaderTestCase({
      profile: {
        language: "fr-fr"
      }
    });

    // Act

    // Assert
    assert.equal(testCase.reader.getI18nProvider().getLanguageIdentifier(), "fr-fr");
  });
});





class UserSettingsReaderTestCase extends TestCase<IUserSettingsReaderFactory> {

  private userId: string;
  constructor(private userDao: UserDAO) {
    super(UserTypes.IUserSettingsReaderFactory);

    this.userId = this.userCollection.insert(userDao);
  }

  public get reader(): IUserSettingsReader {
    return this.getTestObject().createSettingsReaderFor(this.userId);
  }



}

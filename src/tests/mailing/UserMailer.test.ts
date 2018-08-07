import { Types } from "../../server/Types";
import { MailingTypes } from "../../server/mailing/MailingTypes";
import { assert } from "chai";

import * as TypeMoq from "typemoq";
import { IEmailSender } from "../../server/mailing/interfaces/IEmailSender";
import { IUserMailer } from "../../server/mailing/interfaces/IUserMailer";
import { injectable, inject, Kernel, interfaces } from "inversify";

import { MailTestCase } from "./common/MailTestCase";

import * as marked from "marked";

describe("UserMailer", function () {

  it("should not be null or undefined", function () {
    // Arrange
    let testCase = new UserMailerTestCase();

    // Act


    // Assert
    assert.isDefined(testCase.sender);
    assert.isNotNull(testCase.sender);
  });


  it("should not send Email when user not existing", function () {
    // Arrange
    let testCase = new UserMailerTestCase();

    // Act
    testCase.sender.send({
      recepientId: "someUserId",
      subject: "My Test",
      markdownContent: "Test Text",
      replyToAddress: "test@testserver.de"
    });

    // Assert
    testCase.emailAssert.noEmailWasSent();
  });

  it("should send correct email to given user, default sender address", function () {
    // Arrange
    let testCase = new UserMailerTestCase();

    let someUserId = testCase.userCollection.insert({
      emails: [
        {
          address: "someUser@email.com",
          verified: true
        }
      ]
    });

    // Act
    testCase.sender.send({
      recepientId: someUserId,
      subject: "My Test",
      markdownContent: "Test __Text__"
    });

    // Assert
    testCase.emailAssert.emailWasSentWith({
      from: "'PublicAssistant' <no-reply@jw-public.org>",
      replyTo: "'PublicAssistant' <no-reply@jw-public.org>",
      to: "someUser@email.com",
      subject: "My Test",
      text: "Test Text",
      html: marked("Test __Text__")
    });
  });

  it("should send correct email to given user", function () {
    // Arrange
    let testCase = new UserMailerTestCase();

    let someUserId = testCase.userCollection.insert({
      emails: [
        {
          address: "someUser@email.com",
          verified: true
        }
      ]
    });

    // Act
    testCase.sender.send({
      recepientId: someUserId,
      subject: "My Test",
      markdownContent: "Test __Text__",
      replyToAddress: "absender1@test.de"
    });

    // Assert
    testCase.emailAssert.emailWasSentWith({
      from: "'PublicAssistant' <no-reply@jw-public.org>",
      replyTo: "absender1@test.de",
      to: "someUser@email.com",
      subject: "My Test",
      text: "Test Text",
      html: marked("Test __Text__")
    });

  });
});


class UserMailerTestCase extends MailTestCase<IUserMailer> {

  constructor() {
    super(MailingTypes.IUserMailer);
  }

  public get sender() {
    return this.getTestObject();
  }
}

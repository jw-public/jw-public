import { assert } from "chai";
import { MailingTypes } from "../../server/mailing/MailingTypes";

import { IUserMailer } from "../../server/mailing/interfaces/IUserMailer";

import { MailTestCase } from "./common/MailTestCase";

import { marked } from "marked";

describe("UserMailer", function () {
  it("should not be null or undefined", async function () {
    // Arrange
    let testCase = new UserMailerTestCase();

    // Act

    // Assert
    assert.isDefined(testCase.sender);
    assert.isNotNull(testCase.sender);
  });

  it("should not send Email when user not existing", async function () {
    // Arrange
    let testCase = new UserMailerTestCase();

    // Act
    await testCase.sender.send({
      recepientId: "someUserId",
      subject: "My Test",
      markdownContent: "Test Text",
      replyToAddress: "test@testserver.de",
    });

    // Assert
    testCase.emailAssert.noEmailWasSent();
  });

  it("should send correct email to given user, default sender address", async function () {
    // Arrange
    let testCase = new UserMailerTestCase();

    let someUserId = testCase.userCollection.insert({
      emails: [
        {
          address: "someUser@email.com",
          verified: true,
        },
      ],
    });

    // Act
    await testCase.sender.send({
      recepientId: someUserId,
      subject: "My Test",
      markdownContent: "Test __Text__",
    });

    // Assert
    testCase.emailAssert.emailWasSentWith({
      from: "'PublicAssistant' <no-reply@jw-public.org>",
      replyTo: "'PublicAssistant' <no-reply@jw-public.org>",
      to: "someUser@email.com",
      subject: "My Test",
      text: "Test Text",
      html: marked.parse("Test __Text__") as string,
    });
  });

  it("should send correct email to given user", async function () {
    // Arrange
    let testCase = new UserMailerTestCase();

    let someUserId = testCase.userCollection.insert({
      emails: [
        {
          address: "someUser@email.com",
          verified: true,
        },
      ],
    });

    // Act
    await testCase.sender.send({
      recepientId: someUserId,
      subject: "My Test",
      markdownContent: "Test __Text__",
      replyToAddress: "absender1@test.de",
    });

    // Assert
    testCase.emailAssert.emailWasSentWith({
      from: "'PublicAssistant' <no-reply@jw-public.org>",
      replyTo: "absender1@test.de",
      to: "someUser@email.com",
      subject: "My Test",
      text: "Test Text",
      html: marked.parse("Test __Text__") as string,
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

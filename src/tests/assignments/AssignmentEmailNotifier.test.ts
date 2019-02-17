import { AssignmentEventType } from '../../imports/assignments/interfaces/AssignmentEventType';
import { AssignmentServiceTypes } from '../../server/assignments/AssignmentServiceTypes';
import { IAssignmentEmailNotifier } from '../../server/assignments/interfaces/IAssignmentEmailNotifier';
import { UserMailer } from '../../server/mailing/classes/UserMailer';
import { IUserMailer, IUserMailerOptions } from '../../server/mailing/interfaces/IUserMailer';
import { MailingTypes } from '../../server/mailing/MailingTypes';
import { TestCase } from '../common/TestCase';
import { assert } from 'chai';
import * as TypeMoq from 'typemoq';


describe("AssignmentEmailNotifier", function () {

  it("should not be null or undefined", function () {
    // Arrange
    let testCase = new AssignmentEmailNotifierTestCase();

    // Act

    // Assert
    assert.isDefined(testCase.notifier);
    assert.isNotNull(testCase.notifier);
  });

  it("should send E-Mail when accepted. Group has email address.", function () {
    // Arrange
    let testCase = new AssignmentEmailNotifierTestCase();

    // Act
    testCase.notifier.notifyUserAboutAssignmentViaEmail({
      userId: testCase.testUserId,
      assignmentId: "sampleAssignmentId",
      eventType: AssignmentEventType.Accept
    });

    // Assert
    testCase.emailAssert.emailWasSentWith({
      recepientId: testCase.testUserId,
      replyToAddress: "test-group@jw-public.org",
      subject: "Zusage für Trolley TestName am Mo., 24. Okt. 2016 14:00",
      markdownContent: `Hallo Dummy,

wir freuen uns über deine Teilnahme am Trolleydienst TestName am Montag, 24. Okt. um 14:00!

Link zum Termin: http://my-root-url/einsatz/sampleAssignmentId

Deine Brüder der Trolleyorganisation.

---

Wenn du mit der zugeteilten Ansprechperson Kontakt aufnehmen möchtest, klicke auf den oben genannten Link. 
Dort findest du die Kontaktdaten. Bitte sende uns deinen Bericht dieser Schicht an diese Adresse: test-group@jw-public.org`
    });
  });


  it("should send E-Mail when removed", function () {
    // Arrange
    let testCase = new AssignmentEmailNotifierTestCase();


    // Act
    testCase.notifier.notifyUserAboutAssignmentViaEmail({
      userId: testCase.testUserId,
      assignmentId: "sampleAssignmentId",
      eventType: AssignmentEventType.Removed
    });

    // Assert
    testCase.emailAssert.emailWasSentWith({
      recepientId: testCase.testUserId,
      replyToAddress: "test-group@jw-public.org",
      subject: "Absage für Trolley TestName am Mo., 24. Okt. 2016 14:00",
      markdownContent: `Hallo Dummy,

leider ist deine Teilnahme am Trolleydienst TestName am Montag, 24. Okt. um 14:00 nicht möglich!

Deine Brüder der Trolleyorganisation.

---

Wenn du mit der zugeteilten Ansprechperson Kontakt aufnehmen möchtest, klicke auf den oben genannten Link. 
Dort findest du die Kontaktdaten. Bitte sende uns deinen Bericht dieser Schicht an diese Adresse: test-group@jw-public.org`
    });
  });



  it("should send E-Mail when canceled", function () {
    // Arrange
    let testCase = new AssignmentEmailNotifierTestCase();


    // Act
    testCase.notifier.notifyUserAboutAssignmentViaEmail({
      userId: testCase.testUserId,
      assignmentId: "sampleAssignmentId",
      eventType: AssignmentEventType.Cancel,
    });

    // Assert
    testCase.emailAssert.emailWasSentWith({
      recepientId: testCase.testUserId,
      replyToAddress: "test-group@jw-public.org",
      subject: "Absage für Trolley TestName am Mo., 24. Okt. 2016 14:00",
      markdownContent: `Hallo Dummy,

leider musste die Trolleyschicht TestName am Montag, 24. Okt. um 14:00 abgesagt werden.
Der Grund: Regen.

Link zum Termin: http://my-root-url/einsatz/sampleAssignmentId

Deine Brüder der Trolleyorganisation.

---

Wenn du mit der zugeteilten Ansprechperson Kontakt aufnehmen möchtest, klicke auf den oben genannten Link. 
Dort findest du die Kontaktdaten. Bitte sende uns deinen Bericht dieser Schicht an diese Adresse: test-group@jw-public.org`
    });

  });

  it("should send E-Mail when changed", function () {
    // Arrange
    let testCase = new AssignmentEmailNotifierTestCase();


    // Act
    testCase.notifier.notifyUserAboutAssignmentViaEmail({
      userId: testCase.testUserId,
      assignmentId: "sampleAssignmentId",
      eventType: AssignmentEventType.Modified,
    });

    // Assert
    testCase.emailAssert.emailWasSentWith({
      recepientId: testCase.testUserId,
      replyToAddress: "test-group@jw-public.org",
      subject: "Änderung für Trolley TestName am Mo., 24. Okt. 2016 14:00",
      markdownContent: `Hallo Dummy,

bei der Trolleyschicht TestName am Montag, 24. Okt. um 14:00 gab es eine Änderung.
Bitte informiere dich über den Status des Termins und ob er stattfinden kann.

Link zum Termin: http://my-root-url/einsatz/sampleAssignmentId

Deine Brüder der Trolleyorganisation.

---

Wenn du mit der zugeteilten Ansprechperson Kontakt aufnehmen möchtest, klicke auf den oben genannten Link. 
Dort findest du die Kontaktdaten. Bitte sende uns deinen Bericht dieser Schicht an diese Adresse: test-group@jw-public.org`
    });

  });

  it("should send E-Mail when reenabled", function () {
    // Arrange
    let testCase = new AssignmentEmailNotifierTestCase();


    // Act
    testCase.notifier.notifyUserAboutAssignmentViaEmail({
      userId: testCase.testUserId,
      assignmentId: "sampleAssignmentId",
      eventType: AssignmentEventType.Reenable,
      reenablingReason: "Regen hat aufgehört"
    });

    // Assert
    testCase.emailAssert.emailWasSentWith({
      recepientId: testCase.testUserId,
      replyToAddress: "test-group@jw-public.org",
      subject: "Zusage für Trolley TestName am Mo., 24. Okt. 2016 14:00",
      markdownContent: `Hallo Dummy,

wir freuen uns, dass der Trolleydienst TestName am Montag, 24. Okt. um 14:00 nun doch statt finden kann.
Der Grund: Regen hat aufgehört.

Link zum Termin: http://my-root-url/einsatz/sampleAssignmentId

Deine Brüder der Trolleyorganisation.

---

Wenn du mit der zugeteilten Ansprechperson Kontakt aufnehmen möchtest, klicke auf den oben genannten Link. 
Dort findest du die Kontaktdaten. Bitte sende uns deinen Bericht dieser Schicht an diese Adresse: test-group@jw-public.org`
    });
  });

  it("should not send E-Mail when user disabled it", function () {
    // Arrange
    let testCase = new AssignmentEmailNotifierTestCase();
    testCase.userCollection.update({ _id: testCase.testUserId }, {
      $set: {
        "profile.notificationAsEmail": false
      }
    });

    let triggerNotification = (eventType: AssignmentEventType) => {
      testCase.notifier.notifyUserAboutAssignmentViaEmail({
        userId: testCase.testUserId,
        assignmentId: "sampleAssignmentId",
        eventType: eventType,
        reenablingReason: "Regen hat aufgehört"
      });
    }

    // Act
    triggerNotification(AssignmentEventType.Accept);
    triggerNotification(AssignmentEventType.Removed);
    triggerNotification(AssignmentEventType.Reenable);
    triggerNotification(AssignmentEventType.Cancel);
    // Assert
    testCase.emailAssert.noEmailWasSent();


  });

});





class AssignmentEmailNotifierTestCase extends TestCase<IAssignmentEmailNotifier> {
  public _userMailerMock: TypeMoq.Mock<IUserMailer>;

  constructor() {
    super(AssignmentServiceTypes.IAssignmentEmailNotifier);

    this._userMailerMock = TypeMoq.Mock.ofType<IUserMailer>(UserMailer);


    this.replaceWithMock<IUserMailer>(
      {
        type: MailingTypes.IUserMailer,
        mock: this._userMailerMock
      });

    this.assignmentsCollection.insert({
      _id: "sampleAssignmentId",
      name: "TestName",
      group: "test-group-id",
      cancelationReason: "Regen",
      start: new Date("2016-10-24T12:00:00Z")
    });

    this.groupCollection.insert({
      _id: "test-group-id",
      email: "test-group@jw-public.org"
    });

    process.env.ROOT_URL = "http://my-root-url";
  }

  get notifier() {
    return this.getTestObject();
  }

  public get emailAssert() {
    return {
      noEmailWasSent: () => {
        this._userMailerMock.verify(emailSender => emailSender.send(TypeMoq.It.isAny()), TypeMoq.Times.never());
      },
      oneEmailWasSent: () => {
        this._userMailerMock.verify(emailSender => emailSender.send(TypeMoq.It.isAny()), TypeMoq.Times.once());
      },
      emailWasSentWith: (options: IUserMailerOptions) => {
        this._userMailerMock.verify(emailSender => emailSender.send(TypeMoq.It.isValue(options)), TypeMoq.Times.once());
      }
    }
  }


}

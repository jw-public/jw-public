import { Match } from "meteor/check";
import "../../../collections/lib/ValidationFunctions/requiredFor";

let TestTypes = {
  test: 'test',
  othertype: 'someType'
};

const customValidatorTestSchema = new SimpleSchema({
  type: {
    type: String,
    allowedValues: [TestTypes.test, TestTypes.othertype],
    unique: true
  },
  test: {
    type: String,
    optional: true,
    requiredFor: TestTypes.test
  },
  otherfield: {
    type: Number,
    optional: true,
    requiredFor: TestTypes.othertype
  },
  weDontCare: {
    type: String,
    optional: true
  }
});


describe("requiredFor Custom Validation", function () {
  it("muss gültig sein, wenn für den richtigen Typ das richtige Feld gesetzt ist.", function () {


    let matchTest1 = Match.test({
      type: TestTypes.test,
      test: "Dieser Wert ist gesetzt."
    }, customValidatorTestSchema);

    chai.assert(matchTest1, "Der Validator 'requiredFor' hat fälschlicherweise angeschlagen.");

    let matchTest2 = Match.test({
      type: TestTypes.othertype,
      test: "Dieser Wert dürfte egal sein",
      otherfield: 1337
    }, customValidatorTestSchema);

    chai.assert(matchTest2, "Der Validator 'requiredFor' hat fälschlicherweise angeschlagen, wenn" +
      "ein anderes Feld definiert ist, das eigentlich garnicht müsste.");
  });

  it("darf nicht gültig sein, wenn für einen Typ falsche Feld gesetzt ist oder garnichts.", function () {


    let matchTest1 = Match.test({
      type: TestTypes.othertype,
      test: "Dieser Wert ist gesetzt."
    }, customValidatorTestSchema);

    chai.assert(!matchTest1, "Der Validator 'requiredFor' hat nicht angeschlagen, obwohl ein " +
      "benötigter Wert nicht gesetzt war.");

    let matchTest2 = Match.test({
      type: TestTypes.othertype,
    }, customValidatorTestSchema);

    chai.assert(!matchTest2, "Der Validator 'requiredFor' hat nicht angeschlagen," +
      "obwohl garkein Wert angegeben ist.");
  });

  it("darf nicht auslösen, wenn das type Feld nicht gesetzt ist.", function () {

    let mySchema = new SimpleSchema({ name: { type: String, requiredFor: 'GibtEsNicht' } });
    let matchTest1 = Match.test({ name: "Steve" }, mySchema); // Return true

    chai.assert(matchTest1 === true, "Der Validator 'requiredFor' hat angeschlagen, obwohl kein" +
      "type gesetzt war.");
  });
});

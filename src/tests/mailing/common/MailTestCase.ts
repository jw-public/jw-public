import {Types} from "../../../server/Types";
import {MailingTypes} from "../../../server/mailing/MailingTypes";
import {TestCase} from "../../common/TestCase";
import {assert} from "chai";

import * as TypeMoq from "typemoq";


export class MailTestCase<T> extends TestCase<T>{

  constructor(testee: Symbol) {
    super(testee);
  }

}

import { TestCase } from "../../common/TestCase";

export class MailTestCase<T> extends TestCase<T> {
  constructor(testee: symbol) {
    super(testee);
  }
}

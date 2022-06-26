import { assert } from "chai";
import * as lolex from 'lolex';
import * as moment from 'moment';



describe("Lolex", function () {
  let lolexHandle: lolex.Clock;
  beforeEach(function () {
    lolexHandle = lolex.install();
  });

  it("integrates", function () {
    lolexHandle.setSystemTime(new Date("2035-10-24T12:00:00Z"));

    let today = moment();
    assert.equal(today.year(), 2035, "I want back into the future!");
  });

  afterEach(function () {
    lolexHandle.reset();
  });
});

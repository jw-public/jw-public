import * as moment from 'moment';
import { expect, assert } from "chai";
import * as lolex from 'lolex';



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

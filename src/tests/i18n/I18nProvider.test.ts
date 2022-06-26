import { assert } from "chai";
import { I18nProvider } from '../../imports/i18n/classes/I18nProvider';


describe("I18nProvider", function () {


  it("constructor", function () {
    let sut = new I18nProvider("de-de", "Europe/Berlin");
  });

  it("what is hello in german?", function () {
    let sut = new I18nProvider("de-de", "Europe/Berlin");

    let answer = sut.getI18n().hello;

    assert.equal(answer, "Hallo", "Du kannst kein Deutsch!");
  });

});


describe("I18nProvider date parser", function () {


  it("what is 1.9.1914 as short german date-time?", function () {
    let sut = new I18nProvider("de-de", "Europe/Berlin").getDateParser();

    let answer = sut.getShortDateTimeAsString(new Date("1914-10-01T12:00:00Z"));

    assert.equal(answer, "Do., 1. Okt. 1914 13:00", "Du kannst kein Deutsch!");
  });

  it("what is 1.9.1914 as long german date-time?", function () {
    let sut = new I18nProvider("de-de", "Europe/Berlin").getDateParser();

    let answer = sut.getLongDateTimeAsString(new Date("1914-10-01T12:00:00Z"));

    assert.equal(answer, "Donnerstag, 1. Okt. um 13:00", "Du kannst kein Deutsch!");
  });

  it("what is 1.9.1914 as short english date-time?", function () {
    let sut = new I18nProvider("en-en", "Europe/Berlin").getDateParser();

    let answer = sut.getShortDateTimeAsString(new Date("1914-10-01T12:00:00Z"));

    assert.equal(answer, "Thu, Oct 1, 1914 1:00 PM");
  });

  it("what is 1.9.1914 as long english date-time?", function () {
    let sut = new I18nProvider("en-en", "Europe/Berlin").getDateParser();

    let answer = sut.getLongDateTimeAsString(new Date("1914-10-01T12:00:00Z"));

    assert.equal(answer, "Thursday, 1st Oct at 1:00 PM");
  });


  it("what is 11.09.2017 as short french date-time?", function () {
    let sut = new I18nProvider("fr-fr", "Europe/Berlin").getDateParser();

    let answer = sut.getShortDateTimeAsString(new Date("2017-09-11T08:00:00Z"));

    assert.equal(answer, "lun. 11/09/2017 10h00");
  });

  it("what is 11.09.2017 as long french date-time?", function () {
    let sut = new I18nProvider("fr-fr", "Europe/Berlin").getDateParser();

    let answer = sut.getLongDateTimeAsString(new Date("2017-09-11T08:00:00Z"));

    assert.equal(answer, "lundi, le 11 sept. 2017 à 10h00");
  });




});
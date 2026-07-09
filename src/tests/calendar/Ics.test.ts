import { assert } from "chai";
import {
  buildIcsCalendar,
  escapeIcsText,
  foldIcsLine,
  formatIcsDateUtc,
} from "../../imports/calendar/Ics";

const NOW = new Date("2026-07-09T10:00:00Z");

describe("Ics", function () {
  describe("escapeIcsText", function () {
    it("escapes backslash, semicolon, comma and newlines", function () {
      assert.equal(escapeIcsText("a\\b;c,d\ne\r\nf"), "a\\\\b\\;c\\,d\\ne\\nf");
    });
  });

  describe("formatIcsDateUtc", function () {
    it("formats as UTC basic format with Z suffix", function () {
      assert.equal(formatIcsDateUtc(new Date("2026-08-02T14:00:00Z")), "20260802T140000Z");
    });

    it("pads single-digit components", function () {
      assert.equal(formatIcsDateUtc(new Date("2026-01-05T04:05:06Z")), "20260105T040506Z");
    });
  });

  describe("foldIcsLine", function () {
    it("keeps short lines untouched", function () {
      assert.equal(foldIcsLine("SUMMARY:kurz"), "SUMMARY:kurz");
    });

    it("folds long lines with a leading space on continuations", function () {
      const folded = foldIcsLine("SUMMARY:" + "x".repeat(150));
      const lines = folded.split("\r\n");
      assert.isAbove(lines.length, 1, "long line must be folded");
      for (const continuation of lines.slice(1)) {
        assert.equal(continuation[0], " ", "continuation lines start with a space");
      }
      // Unfolding (strip CRLF+space) must restore the original content.
      assert.equal(folded.replace(/\r\n /g, ""), "SUMMARY:" + "x".repeat(150));
    });
  });

  describe("buildIcsCalendar", function () {
    it("builds a calendar frame with name and CRLF line endings", function () {
      const ics = buildIcsCalendar({ name: "Meine Einsätze", events: [], now: NOW });

      assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
      assert.include(ics, "VERSION:2.0\r\n");
      assert.include(ics, "X-WR-CALNAME:Meine Einsätze\r\n");
      assert.match(ics, /END:VCALENDAR\r\n$/);
    });

    it("renders events with UTC times, status and escaped fields", function () {
      const ics = buildIcsCalendar({
        name: "Test",
        now: NOW,
        events: [
          {
            uid: "abc123@jw-public.org",
            summary: "Sinnflut Erding; Halle 1",
            start: new Date("2026-08-02T14:00:00Z"),
            end: new Date("2026-08-02T16:00:00Z"),
            status: "CONFIRMED",
            location: "Treffpunkt, Bahnhof",
            description: "Zeile 1\nZeile 2",
            url: "https://jw-public.org/einsatz/abc123",
          },
        ],
      });

      assert.include(ics, "BEGIN:VEVENT");
      assert.include(ics, "UID:abc123@jw-public.org");
      assert.include(ics, "DTSTAMP:20260709T100000Z");
      assert.include(ics, "DTSTART:20260802T140000Z");
      assert.include(ics, "DTEND:20260802T160000Z");
      assert.include(ics, "SUMMARY:Sinnflut Erding\\; Halle 1");
      assert.include(ics, "STATUS:CONFIRMED");
      assert.include(ics, "LOCATION:Treffpunkt\\, Bahnhof");
      assert.include(ics, "DESCRIPTION:Zeile 1\\nZeile 2");
      assert.include(ics, "END:VEVENT");
    });

    it("renders tentative and cancelled statuses", function () {
      const ics = buildIcsCalendar({
        name: "Test",
        now: NOW,
        events: [
          {
            uid: "a@x",
            summary: "Beworben",
            start: NOW,
            end: NOW,
            status: "TENTATIVE",
          },
          {
            uid: "b@x",
            summary: "Abgesagt",
            start: NOW,
            end: NOW,
            status: "CANCELLED",
          },
        ],
      });

      assert.include(ics, "STATUS:TENTATIVE");
      assert.include(ics, "STATUS:CANCELLED");
    });
  });
});

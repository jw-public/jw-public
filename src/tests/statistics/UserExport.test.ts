import { assert } from "chai";

import { buildUserCsv, UserExportRow } from "../../imports/statistics/UserExport";

function row(overrides: Partial<UserExportRow> = {}): UserExportRow {
  return {
    lastName: "Mustermann",
    firstName: "Max",
    email: "max@example.org",
    groupNames: ["Innenstadt"],
    lastLogin: new Date(2026, 7, 21),
    lastActivity: new Date(2026, 7, 21),
    ...overrides,
  };
}

describe("UserExport", function () {
  it("starts with a BOM so German Excel reads the umlauts", function () {
    const csv = buildUserCsv([]);
    assert.equal(csv.charCodeAt(0), 0xfeff);
  });

  it("writes the header and one line per user, semicolon separated", function () {
    const csv = buildUserCsv([row()]);
    const lines = csv.replace("﻿", "").trim().split("\r\n");

    assert.equal(lines[0], "Nachname;Vorname;E-Mail;Gruppen;Letzte Anmeldung;Letzte Aktivität");
    assert.equal(lines[1], "Mustermann;Max;max@example.org;Innenstadt;2026-08-21;2026-08-21");
  });

  it("leaves the last login empty when the token has expired", function () {
    const csv = buildUserCsv([row({ lastLogin: null, lastActivity: new Date(2026, 2, 14) })]);
    const line = csv.replace("﻿", "").trim().split("\r\n")[1];

    assert.include(line, ";;2026-03-14");
  });

  it("joins several groups into one field", function () {
    const csv = buildUserCsv([row({ groupNames: ["Innenstadt", "Bahnhof"] })]);
    // Das Komma im Feld erzwingt keine Maskierung — der Trenner ist ein Semikolon.
    assert.include(csv, "Innenstadt, Bahnhof");
  });

  it("quotes fields containing the separator", function () {
    const csv = buildUserCsv([row({ lastName: "Meier; Schulze" })]);
    assert.include(csv, '"Meier; Schulze"');
  });

  it("doubles embedded quotes", function () {
    const csv = buildUserCsv([row({ firstName: 'Max "Maxi"' })]);
    assert.include(csv, '"Max ""Maxi"""');
  });

  it("keeps a line break inside a field from breaking the row", function () {
    const csv = buildUserCsv([row({ lastName: "Zeile1\nZeile2" })]);
    assert.include(csv, '"Zeile1\nZeile2"');
  });
});

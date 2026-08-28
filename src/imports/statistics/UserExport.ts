// Reine Aufbereitung des Admin-CSV-Exports. Meteor-frei, damit Zeilenaufbau
// und Maskierung ohne Meteor-Laufzeit testbar sind.

export interface UserExportRow {
  lastName: string;
  firstName: string;
  email: string;
  groupNames: string[];
  /**
   * Letzte Anmeldung. Kann leer sein: Meteor löscht abgelaufene Login-Tokens
   * (Standard nach 90 Tagen), und ohne Token gibt es keinen Zeitpunkt mehr.
   * Genau deshalb steht die letzte Aktivität daneben.
   */
  lastLogin: Date | null;
  /** Spätester Zeitpunkt aus Anmeldung, Profiländerung, Termin und Registrierung. */
  lastActivity: Date | null;
}

export const USER_EXPORT_HEADER = [
  "Nachname",
  "Vorname",
  "E-Mail",
  "Gruppen",
  "Letzte Anmeldung",
  "Letzte Aktivität",
];

/** ISO-Datum ohne Uhrzeit — in jeder Tabellenkalkulation sortierbar. */
function formatDate(date: Date | null): string {
  if (!date) {
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Feld nach RFC 4180 maskieren: in Anführungszeichen, sobald Trennzeichen,
 * Anführungszeichen oder ein Zeilenumbruch vorkommen; enthaltene
 * Anführungszeichen werden verdoppelt.
 */
function escapeField(value: string, separator: string): string {
  if (
    value.includes(separator) ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Baut die CSV-Datei.
 *
 * Semikolon statt Komma und ein vorangestelltes BOM: nur so öffnet deutsches
 * Excel die Datei per Doppelklick spaltenrichtig und mit korrekten Umlauten.
 */
export function buildUserCsv(rows: UserExportRow[], separator = ";"): string {
  const lines = [USER_EXPORT_HEADER.map((h) => escapeField(h, separator)).join(separator)];

  rows.forEach((row) => {
    lines.push(
      [
        row.lastName,
        row.firstName,
        row.email,
        row.groupNames.join(", "),
        formatDate(row.lastLogin),
        formatDate(row.lastActivity),
      ]
        .map((field) => escapeField(field ?? "", separator))
        .join(separator),
    );
  });

  return "﻿" + lines.join("\r\n") + "\r\n";
}

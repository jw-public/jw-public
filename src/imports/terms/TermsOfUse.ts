/**
 * Nutzungsbedingungen: Version und Inhalt — eine Quelle für die öffentliche
 * Seite, die Registrierungs-Checkbox und das Login-Consent-Gate.
 *
 * Die Version wird am User-Dokument gespeichert (users.termsOfUse.version).
 * Wird der Text inhaltlich geändert, MUSS die Version hochgezählt werden —
 * dann fragt das Login-Gate alle Bestandsnutzer erneut.
 *
 * Isomorph (kein React, kein DOM): der Server braucht die Version in
 * Accounts.validateNewUser und der acceptTerms-Method.
 */

export const TERMS_OF_USE_VERSION = "2026-06";

export interface TermsSection {
  title: string;
  paragraphs: string[];
}

// HINWEIS: Entwurf — vor dem produktiven Release juristisch prüfen lassen.
export const TERMS_OF_USE_SECTIONS: TermsSection[] = [
  {
    title: "1. Geltungsbereich und Zweck",
    paragraphs: [
      "Diese Anwendung dient der Organisation des Trolley-Dienstes (Öffentlichkeitsarbeit). " +
        "Sie ermöglicht die Planung von Einsätzen, die Verwaltung von Gruppen sowie die " +
        "Kommunikation zwischen Teilnehmern und Koordinatoren.",
      "Mit der Registrierung bzw. der Zustimmung zu diesen Nutzungsbedingungen erklärst Du " +
        "Dich mit den nachfolgenden Regelungen einverstanden. Ohne Zustimmung ist eine " +
        "Nutzung der Anwendung nicht möglich.",
    ],
  },
  {
    title: "2. Verarbeitung personenbezogener Daten",
    paragraphs: [
      "Zur Organisation des Dienstes werden folgende personenbezogene Daten gespeichert: " +
        "Vor- und Nachname, E-Mail-Adresse, Handynummer, Wohnort und Postleitzahl, Geschlecht " +
        "sowie Angaben zur Verfügbarkeit (z. B. Auto vorhanden, Pionier-Status) und Deine " +
        "Einsatz-Bewerbungen und -Teilnahmen.",
      "Diese Daten werden ausschließlich für den Zweck der Organisation der " +
        "Öffentlichkeitsarbeit verwendet und nicht an Dritte außerhalb der Organisation " +
        "weitergegeben.",
      "Deine Kontaktdaten sind für die Koordinatoren Deiner Gruppe sichtbar. Für andere " +
        "Teilnehmer sind sie nur sichtbar, wenn Ihr gemeinsam für einen Einsatz eingeteilt " +
        "seid, damit Ihr Euch untereinander abstimmen könnt.",
    ],
  },
  {
    title: "3. Speicherdauer und Löschung",
    paragraphs: [
      "Deine Daten werden gespeichert, solange Dein Benutzerkonto besteht. Du kannst die " +
        "Löschung Deines Kontos jederzeit bei Deinem Koordinator beantragen; damit werden " +
        "Deine personenbezogenen Daten aus der Anwendung entfernt.",
    ],
  },
  {
    title: "4. Pflichten der Nutzer",
    paragraphs: [
      "Du verpflichtest Dich, nur wahrheitsgemäße Angaben zu machen, Deine Zugangsdaten " +
        "vertraulich zu behandeln und die Anwendung ausschließlich für die Organisation des " +
        "Trolley-Dienstes zu verwenden.",
      "Die über die Anwendung einsehbaren Kontaktdaten anderer Teilnehmer dürfen nur zur " +
        "Abstimmung der gemeinsamen Einsätze verwendet werden.",
    ],
  },
  {
    title: "5. Änderungen dieser Bedingungen",
    paragraphs: [
      "Bei inhaltlichen Änderungen dieser Nutzungsbedingungen wirst Du bei der nächsten " +
        "Anmeldung erneut um Zustimmung gebeten. Stand: Juni 2026 (Version " +
        TERMS_OF_USE_VERSION +
        ").",
    ],
  },
];

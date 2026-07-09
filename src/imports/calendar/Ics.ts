/**
 * Minimaler, reiner iCalendar-Builder (RFC 5545) für das persönliche
 * Kalender-Abo. Bewusst ohne Fremdbibliothek: gebraucht werden nur
 * VCALENDAR/VEVENT mit UTC-Zeiten, Escaping und Zeilen-Folding — dafür lohnt
 * keine Dependency. Pure Funktionen, damit sie unter Mocha testbar sind.
 */

export type IcsEventStatus = "CONFIRMED" | "TENTATIVE" | "CANCELLED";

export interface IcsEvent {
  /** Stabil pro Termin (z.B. "<assignmentId>@jw-public.org") — Kalender-Clients aktualisieren darüber. */
  uid: string;
  summary: string;
  start: Date;
  end: Date;
  status: IcsEventStatus;
  description?: string;
  location?: string;
  url?: string;
}

export interface IcsCalendarOptions {
  /** Anzeigename des Abos im Kalender-Client (X-WR-CALNAME). */
  name: string;
  events: IcsEvent[];
  /** DTSTAMP aller Events; injizierbar für deterministische Tests. */
  now?: Date;
}

/** Text-Escaping nach RFC 5545 3.3.11: Backslash, Semikolon, Komma, Zeilenumbrüche. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/** UTC-Zeitformat YYYYMMDDTHHMMSSZ. */
export function formatIcsDateUtc(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/**
 * Zeilen-Folding nach RFC 5545 3.1: Zeilen sollen 75 Oktette nicht
 * überschreiten; Fortsetzungszeilen beginnen mit einem Leerzeichen. Gefaltet
 * wird konservativ nach 60 Zeichen, damit auch Mehrbyte-Zeichen (Umlaute)
 * sicher unter der Oktett-Grenze bleiben.
 */
export function foldIcsLine(line: string): string {
  const LIMIT = 60;
  if (line.length <= LIMIT) {
    return line;
  }
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, LIMIT));
  rest = rest.slice(LIMIT);
  while (rest.length > 0) {
    parts.push(" " + rest.slice(0, LIMIT - 1));
    rest = rest.slice(LIMIT - 1);
  }
  return parts.join("\r\n");
}

export function buildIcsCalendar(options: IcsCalendarOptions): string {
  const now = options.now ?? new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//jw-public//PublicAssistant//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(options.name)}`,
  ];

  for (const event of options.events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${escapeIcsText(event.uid)}`);
    lines.push(`DTSTAMP:${formatIcsDateUtc(now)}`);
    lines.push(`DTSTART:${formatIcsDateUtc(event.start)}`);
    lines.push(`DTEND:${formatIcsDateUtc(event.end)}`);
    lines.push(`SUMMARY:${escapeIcsText(event.summary)}`);
    lines.push(`STATUS:${event.status}`);
    if (event.location) {
      lines.push(`LOCATION:${escapeIcsText(event.location)}`);
    }
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    }
    if (event.url) {
      lines.push(`URL:${escapeIcsText(event.url)}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}

import { Meteor } from "meteor/meteor";
import { WebApp } from "meteor/webapp";

import { Assignments } from "../../collections/lib/AssignmentsCollection";
import { AssignmentState } from "../../collections/lib/classes/AssignmentState";
import { buildIcsCalendar, IcsEvent } from "../../imports/calendar/Ics";

/**
 * Persönliches iCal-Kalenderabo: GET /api/calendar/<token>.ics
 *
 * Der Token (siehe getCalendarToken-Method) ist das einzige Credential —
 * hohe Entropie (160 bit), nie publiziert, per resetCalendarToken
 * widerrufbar. Kalender-Clients (Google/Apple/Outlook) pollen die URL und
 * halten die Termine des Users automatisch aktuell:
 * - Teilnahmen  -> STATUS:CONFIRMED
 * - Bewerbungen -> STATUS:TENTATIVE (Prefix "Bewerbung:")
 * - Abgesagte   -> STATUS:CANCELLED (Prefix "Abgesagt:")
 */

const TOKEN_PATH = /^\/([a-fA-F0-9]{40})\.ics$/;
const LOOKBACK_DAYS = 30;
const MAX_EVENTS = 500;

WebApp.connectHandlers.use("/api/calendar", (req, res) => {
  void (async () => {
    try {
      const path = (req.url ?? "").split("?")[0];
      const match = TOKEN_PATH.exec(path);
      if (!match || req.method !== "GET") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }

      const user = await Meteor.users.findOneAsync(
        { calendarToken: match[1] },
        { fields: { _id: 1, "profile.first_name": 1 } },
      );
      if (!user) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }

      const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
      const assignments = await Assignments.find(
        {
          $or: [{ "participants.user": user._id }, { "applicants.user": user._id }],
          start: { $gte: since },
        },
        {
          sort: { start: 1 },
          limit: MAX_EVENTS,
          fields: {
            name: 1,
            start: 1,
            end: 1,
            state: 1,
            note: 1,
            pickup_point: 1,
            "participants.user": 1,
            "applicants.user": 1,
          },
        },
      ).fetchAsync();

      const rootUrl = (process.env.ROOT_URL ?? "").replace(/\/$/, "");
      const events: IcsEvent[] = assignments.map((assignment) => {
        const isParticipant = (assignment.participants ?? []).some((e) => e.user === user._id);
        const isCanceled = assignment.state === AssignmentState[AssignmentState.Canceled];

        let status: IcsEvent["status"] = isParticipant ? "CONFIRMED" : "TENTATIVE";
        let summary = isParticipant ? assignment.name : `Bewerbung: ${assignment.name}`;
        if (isCanceled) {
          status = "CANCELLED";
          summary = `Abgesagt: ${assignment.name}`;
        }

        return {
          uid: `${assignment._id}@jw-public.org`,
          summary,
          start: assignment.start,
          end: assignment.end,
          status,
          location: assignment.pickup_point,
          description: assignment.note,
          url: `${rootUrl}/einsatz/${assignment._id}`,
        };
      });

      const ics = buildIcsCalendar({ name: "PublicAssistant – Meine Einsätze", events });
      res.writeHead(200, {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="publicassistant.ics"',
        "Cache-Control": "private, no-cache",
      });
      res.end(ics);
    } catch (error) {
      console.error("Calendar feed failed:", error);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal error");
    }
  })();
});

// Der Feed sucht Users über calendarToken — sparse Index statt Collection-Scan.
Meteor.startup(async () => {
  await Meteor.users.rawCollection().createIndex({ calendarToken: 1 }, { sparse: true });
});

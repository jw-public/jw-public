import { Meteor } from "meteor/meteor";
import { app } from "./App";

/**
 * Reminder-Scheduler: erinnert Teilnehmer an Einsätze, die innerhalb der
 * nächsten 24h beginnen (siehe AssignmentReminder). Läuft alle 15 Minuten
 * plus einmal direkt nach dem Start (Catch-up nach Deploys/Restarts);
 * Duplikate verhindert der remindersSentAt-Stempel am Assignment, nicht der
 * Timer — der Intervallwert ist daher unkritisch.
 */
const REMINDER_INTERVAL_MS = 15 * 60 * 1000;

Meteor.startup(() => {
  const run = async () => {
    try {
      const reminded = await app.assignmentReminder.sendDueReminders();
      if (reminded > 0) {
        console.log(`AssignmentReminder: sent reminders for ${reminded} assignment(s)`);
      }
    } catch (error) {
      console.error("AssignmentReminder run failed:", error);
    }
  };

  void run();
  Meteor.setInterval(() => void run(), REMINDER_INTERVAL_MS);
});

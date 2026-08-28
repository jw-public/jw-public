import * as React from "react";
import moment from "moment";

import { AssignmentDAO } from "../../../../collections/lib/AssignmentsCollection";
import { AssignmentState } from "../../../../collections/lib/classes/AssignmentState";
import { readOccupancy } from "./subComponents/lib/AssignmentOccupancy";

export interface AssignmentCalendarProps {
  /** Alle Termine des angezeigten Monats, bereits gefiltert. */
  assignments: AssignmentDAO[];
  /** Der angezeigte Monat (irgendein Tag darin). */
  month: moment.Moment;
  /** Aktuell ausgewählter Tag (ISO-Datum) oder null für "kein Tag gewählt". */
  selectedDay: string | null;
  onSelectDay: (isoDay: string | null) => void;
}

const DAY_KEY_FORMAT = "YYYY-MM-DD";
/** Mehr Balken passen nicht in eine Zelle, ohne dass das Raster ausfranst. */
const MAX_BARS_PER_DAY = 3;

/**
 * Farbe eines Tagesbalkens: abgesagt und geschlossen haben Vorrang, sonst
 * entscheidet die Besetzung — leer, teilweise besetzt, voll.
 */
function barModifier(assignment: AssignmentDAO): string {
  if (assignment.state === AssignmentState[AssignmentState.Canceled]) {
    return "canceled";
  }
  if (assignment.state === AssignmentState[AssignmentState.Closed]) {
    return "closed";
  }

  const { userGoal, totalUsers } = readOccupancy(assignment);
  if (userGoal > 0 && totalUsers >= userGoal) {
    return "full";
  }
  if (totalUsers === 0) {
    return "empty";
  }
  return "partial";
}

function groupByDay(assignments: AssignmentDAO[]): Map<string, AssignmentDAO[]> {
  const byDay = new Map<string, AssignmentDAO[]>();

  assignments.forEach((assignment) => {
    const key = moment(assignment.start).format(DAY_KEY_FORMAT);
    const entries = byDay.get(key);
    if (entries) {
      entries.push(assignment);
    } else {
      byDay.set(key, [assignment]);
    }
  });

  return byDay;
}

/**
 * Monatsraster über die Termine des gewählten Monats. Ein Klick auf einen Tag
 * schaltet die Auswahl um; die Liste darunter zeigt dann nur diesen Tag.
 *
 * Das Raster beginnt immer am Montag der Woche des Monatsersten und endet am
 * Sonntag der Woche des Monatsletzten, damit die Spalten über alle Monate
 * hinweg denselben Wochentagen entsprechen.
 */
export default function AssignmentCalendar(props: AssignmentCalendarProps): JSX.Element {
  const byDay = groupByDay(props.assignments);

  const monthStart = props.month.clone().startOf("month");
  const gridStart = monthStart.clone().startOf("isoWeek");
  const gridEnd = props.month.clone().endOf("month").endOf("isoWeek");
  const today = moment().startOf("day");

  const days: moment.Moment[] = [];
  for (const day = gridStart.clone(); day.isSameOrBefore(gridEnd, "day"); day.add(1, "day")) {
    days.push(day.clone());
  }

  const weekdayNames = Array.from({ length: 7 }, (_unused, i) =>
    gridStart.clone().add(i, "day").format("dd"),
  );

  return (
    <div className="assignment-calendar">
      <div className="assignment-calendar-grid">
        {weekdayNames.map((name) => (
          <div key={`head-${name}`} className="assignment-calendar-weekday">
            {name}
          </div>
        ))}

        {days.map((day) => {
          const key = day.format(DAY_KEY_FORMAT);
          const entries = byDay.get(key) ?? [];
          const classNames = ["assignment-calendar-day"];

          if (!day.isSame(monthStart, "month")) {
            classNames.push("is-outside");
          }
          if (day.isSame(today, "day")) {
            classNames.push("is-today");
          }
          if (key === props.selectedDay) {
            classNames.push("is-selected");
          }
          if (entries.length > 0) {
            classNames.push("has-assignments");
          }

          return (
            <div
              key={key}
              className={classNames.join(" ")}
              role="button"
              tabIndex={0}
              aria-pressed={key === props.selectedDay}
              title={
                entries.length > 0
                  ? entries.map((a) => `${moment(a.start).format("LT")} ${a.name}`).join("\n")
                  : undefined
              }
              onClick={() => props.onSelectDay(key === props.selectedDay ? null : key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  props.onSelectDay(key === props.selectedDay ? null : key);
                }
              }}
            >
              <span className="assignment-calendar-daynumber">{day.date()}</span>
              <span className="assignment-calendar-bars">
                {entries.slice(0, MAX_BARS_PER_DAY).map((assignment) => (
                  <span
                    key={assignment._id}
                    className={`assignment-calendar-bar is-${barModifier(assignment)}`}
                  ></span>
                ))}
                {entries.length > MAX_BARS_PER_DAY ? (
                  <span className="assignment-calendar-more">
                    +{entries.length - MAX_BARS_PER_DAY}
                  </span>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>

      <div className="assignment-calendar-legend small text-muted">
        <span className="assignment-calendar-bar is-empty"></span> unbesetzt{" "}
        <span className="assignment-calendar-bar is-partial"></span> teilweise besetzt{" "}
        <span className="assignment-calendar-bar is-full"></span> voll{" "}
        <span className="assignment-calendar-bar is-closed"></span> geschlossen{" "}
        <span className="assignment-calendar-bar is-canceled"></span> abgesagt
      </div>
    </div>
  );
}

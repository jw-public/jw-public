import * as React from "react";
import { useMemo } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import moment from "moment";
import { Link } from "react-router-dom";

import { AssignmentDAO, Assignments } from "../../../../collections/lib/AssignmentsCollection";
import { Groups } from "../../../../collections/lib/GroupCollection";
import { Routes } from "../../../../lib/client/routes";
import { useCachedSubscription } from "../../../react/lib/useCachedSubscription";

import AssignmentPanel from "../showOverview/AssignmentPanel";

/**
 * Persönliche Terminübersicht: alle eigenen Termine über Monats- und
 * Gruppengrenzen hinweg, gruppiert nach Monat.
 *
 * Der Ausschnitt entspricht der Publication "myAssignments" und damit dem
 * iCal-Kalenderabo: künftige Termine plus die letzten 30 Tage.
 *
 * Bearbeiten ist hier nie möglich (canModify=false) — die Seite zeigt Termine
 * aus mehreren Gruppen, und ob man in einer davon Koordinator ist, wäre pro
 * Karte zu klären. Wer verwalten will, geht über die Gruppenübersicht.
 */

interface GroupBlock {
  groupId: string;
  assignments: AssignmentDAO[];
}

interface MonthSection {
  key: string;
  heading: string;
  count: number;
  blocks: GroupBlock[];
}

/**
 * Zweistufige Gliederung: Monat, darin Gruppe. Der Gruppenname steht einmal
 * über einem Block statt einmal pro Karte — sonst bräuchte jede Karte eine
 * eigene volle Zeile und das Kartenraster fiele auseinander.
 *
 * Die Termine kommen bereits nach Startzeit sortiert an; innerhalb eines
 * Monats bleibt diese Reihenfolge je Gruppe erhalten.
 */
function groupByMonthAndGroup(assignments: AssignmentDAO[]): MonthSection[] {
  const sections: MonthSection[] = [];

  assignments.forEach((assignment) => {
    const start = moment(assignment.start);
    const key = start.format("YYYY-MM");

    let section = sections[sections.length - 1];
    if (!section || section.key !== key) {
      section = { key, heading: start.format("MMMM YYYY"), count: 0, blocks: [] };
      sections.push(section);
    }
    section.count += 1;

    const block = section.blocks.find((b) => b.groupId === assignment.group);
    if (block) {
      block.assignments.push(assignment);
    } else {
      section.blocks.push({ groupId: assignment.group, assignments: [assignment] });
    }
  });

  return sections;
}

export default function MyAssignments(): JSX.Element {
  const assignmentsReady = useCachedSubscription("myAssignments");
  const groupsReady = useCachedSubscription("groupNamesOfMyAssignments");

  const assignments = useTracker(() => {
    const userId = Meteor.userId();
    if (!userId) {
      return [] as AssignmentDAO[];
    }
    return Assignments.find(
      { $or: [{ "participants.user": userId }, { "applicants.user": userId }] },
      { sort: { start: 1, name: 1, _id: 1 } },
    ).fetch();
  }, []);

  const groupNames = useTracker(() => {
    const names = new Map<string, string>();
    Groups.find({}, { fields: { _id: 1, name: 1 } }).forEach((g) => names.set(g._id!, g.name));
    return names;
  }, []);

  const sections = useMemo(() => groupByMonthAndGroup(assignments), [assignments]);
  const ready = assignmentsReady && groupsReady;

  return (
    <div>
      <div className="row">
        <div className="col-lg-12">
          <h1 className="page-header">
            <Link className="btn btn-primary" to={Routes.path(Routes.Def.Home)}>
              <i className="fa fa-chevron-left fa-fw"></i>
            </Link>{" "}
            Meine Termine
          </h1>
        </div>
      </div>

      {!ready ? (
        <div className="row">
          <div className="col-lg-12 huge text-center">
            <i className="fa fa-circle-o faa-burst fa-3x animated"></i>
          </div>
        </div>
      ) : null}

      {ready && sections.length === 0 ? (
        <div className="row">
          <div className="col-lg-12">
            <div className="alert alert-info" role="alert">
              <strong>
                <i className="fa fa-info-circle"></i> Du hast keine Termine.
              </strong>{" "}
              Sobald du dich auf einen Termin bewirbst oder an einem teilnimmst, erscheint er hier —
              über alle deine Gruppen und Monate hinweg.
            </div>
          </div>
        </div>
      ) : null}

      {ready
        ? sections.map((section) => (
            <div key={section.key}>
              <div className="row">
                <div className="col-lg-12">
                  <h2 className="page-header my-assignments-month">
                    {section.heading}{" "}
                    <small>
                      {section.count} {section.count === 1 ? "Termin" : "Termine"}
                    </small>
                  </h2>
                </div>
              </div>

              {section.blocks.map((block) => (
                <div className="row" key={`${section.key}-${block.groupId}`}>
                  <div className="col-lg-12 my-assignments-group">
                    <span className="text-muted small">
                      <i className="fa fa-sitemap fa-fw"></i>{" "}
                      {groupNames.get(block.groupId) ?? "Unbekannte Gruppe"}
                    </span>
                  </div>
                  {block.assignments.map((assignment) => (
                    <AssignmentPanel
                      key={assignment._id}
                      assignment={assignment}
                      canModify={false}
                    />
                  ))}
                </div>
              ))}
            </div>
          ))
        : null}
    </div>
  );
}

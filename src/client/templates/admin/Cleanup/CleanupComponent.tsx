import * as React from "react";
import { useEffect, useState } from "react";
import moment from "moment";

import { callMethod } from "../../../../imports/methods/MethodContracts";
import {
  InactiveGroupEntry,
  InactiveUserEntry,
  InactivityReport,
} from "../../../../imports/cleanup/InactivityReport";
import { alertDialog, confirmDialog } from "../../../react/components/dialogs";
import DataTable from "../../../react/components/DataTable";

// Admin data-hygiene page: surfaces groups without recent assignments and
// users without recent logins/activity, so old data can be cleaned up
// deliberately (data minimisation — the database is 11 years old).

const THRESHOLDS = [
  { label: "6 Monate", days: 183 },
  { label: "12 Monate", days: 365 },
  { label: "24 Monate", days: 730 },
  // 0 = everything: doubles as a plain activity overview of all groups/users.
  { label: "egal (alles anzeigen)", days: 0 },
];

function fmt(date: Date | null): string {
  if (!date) {
    return "unbekannt";
  }
  return `${moment(date).format("L")} (${moment(date).fromNow()})`;
}

export default function Cleanup(): JSX.Element {
  const [thresholdDays, setThresholdDays] = useState(365);
  const [report, setReport] = useState<InactivityReport | null>(null);
  // Loading is derived: no report yet, or the shown report belongs to another
  // threshold (avoids synchronous setState inside the effect).
  const loading = report === null || report.thresholdDays !== thresholdDays;

  const load = (days: number) => {
    callMethod("adminInactivityReport", days)
      .then((r) => setReport(r))
      .catch((err) => {
        console.error(err);
        void alertDialog("Der Report konnte nicht geladen werden.", "Fehler");
      });
  };

  useEffect(() => {
    load(thresholdDays);
  }, [thresholdDays]);

  const onDeleteGroup = (g: InactiveGroupEntry) => {
    void confirmDialog({
      title: "Gruppe löschen",
      message:
        `Die Gruppe "${g.name}" wird endgültig gelöscht, mitsamt ` +
        `${g.assignmentCount} Terminen und den Mitgliedschaften von ` +
        `${g.memberCount} Benutzern (die Benutzerkonten bleiben bestehen).`,
      yesVariant: "danger",
    }).then((yes) => {
      if (!yes) {
        return;
      }
      callMethod("adminDeleteGroup", g._id)
        .then(() => load(thresholdDays))
        .catch((err) => {
          console.error(err);
          void alertDialog("Die Gruppe konnte nicht gelöscht werden.", "Fehler");
        });
    });
  };

  const onDeleteUser = (u: InactiveUserEntry) => {
    void confirmDialog({
      title: "Benutzer löschen",
      message:
        `Der Benutzer "${u.name}" (${u.email || "ohne E-Mail"}) wird endgültig ` +
        `gelöscht, mitsamt Benachrichtigungen sowie Teilnahmen und Bewerbungen ` +
        `in Terminen.`,
      yesVariant: "danger",
    }).then((yes) => {
      if (!yes) {
        return;
      }
      callMethod("removeUser", u._id)
        .then(() => load(thresholdDays))
        .catch((err) => {
          console.error(err);
          void alertDialog("Der Benutzer konnte nicht gelöscht werden.", "Fehler");
        });
    });
  };

  return (
    <div>
      <div className="row">
        <div className="col-lg-12">
          <h1 className="page-header">Aufräumen</h1>
          <p>
            Gruppen ohne Termine und Benutzer ohne Anmeldung/Aktivität seit dem gewählten Zeitraum.
            Gelöscht wird nur nach Bestätigung, dann aber endgültig.
          </p>
          <div className="form-group" style={{ maxWidth: "320px" }}>
            <label htmlFor="cleanupThreshold">Inaktiv seit mindestens</label>
            <select
              id="cleanupThreshold"
              className="form-control"
              value={thresholdDays}
              onChange={(e) => setThresholdDays(Number(e.target.value))}
            >
              {THRESHOLDS.map((t) => (
                <option key={t.days} value={t.days}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          {loading ? (
            <p>
              <i className="fa fa-circle-o-notch faa-spin animated"></i> Analysiere…
            </p>
          ) : null}
        </div>
      </div>

      {report ? (
        <div className="row">
          <div className="col-lg-6">
            <div className="card card-primary" id="inactiveGroupsPanel">
              <div className="card-header">
                <i className="fa fa-users fa-fw"></i> Inaktive Gruppen ({report.groups.length})
              </div>
              <div className="card-body">
                {report.groups.length === 0 ? (
                  <p className="text-muted">Keine inaktiven Gruppen im gewählten Zeitraum.</p>
                ) : (
                  <DataTable
                    rows={report.groups}
                    rowKey={(g) => g._id}
                    searchText={(g) => g.name}
                    defaultSort={{ column: 1, direction: "asc" }}
                    columns={[
                      { title: "Name", render: (g) => g.name, sortValue: (g) => g.name },
                      {
                        title: "Letzter Termin",
                        render: (g) => fmt(g.lastActivity),
                        sortValue: (g) => g.lastActivity ?? new Date(0),
                      },
                      { title: "Mitglieder", render: (g) => g.memberCount },
                      { title: "Termine", render: (g) => g.assignmentCount },
                      {
                        title: "",
                        render: (g) => (
                          <button
                            type="button"
                            className="btn btn-sm btn-danger delete-group"
                            title={`Gruppe ${g.name} löschen`}
                            onClick={() => onDeleteGroup(g)}
                          >
                            <i className="fa fa-trash-o"></i> Löschen
                          </button>
                        ),
                      },
                    ]}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card card-primary" id="inactiveUsersPanel">
              <div className="card-header">
                <i className="fa fa-user-times fa-fw"></i> Inaktive Benutzer ({report.users.length})
              </div>
              <div className="card-body">
                {report.users.length === 0 ? (
                  <p className="text-muted">Keine inaktiven Benutzer im gewählten Zeitraum.</p>
                ) : (
                  <DataTable
                    rows={report.users}
                    rowKey={(u) => u._id}
                    searchText={(u) => `${u.name} ${u.email} ${u.groupNames.join(" ")}`}
                    defaultSort={{ column: 2, direction: "asc" }}
                    columns={[
                      { title: "Name", render: (u) => u.name, sortValue: (u) => u.name },
                      { title: "E-Mail", render: (u) => u.email, sortValue: (u) => u.email },
                      {
                        title: "Letzte Aktivität",
                        render: (u) => fmt(u.lastActivity),
                        sortValue: (u) => u.lastActivity ?? new Date(0),
                      },
                      {
                        title: "Letzter Login",
                        render: (u) => fmt(u.lastLogin),
                        sortValue: (u) => u.lastLogin ?? new Date(0),
                      },
                      { title: "Gruppen", render: (u) => u.groupNames.join(", ") },
                      {
                        title: "",
                        render: (u) =>
                          u.isAdmin ? (
                            <span
                              className="text-muted small"
                              title="Administratoren können nicht gelöscht werden"
                            >
                              Admin
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-danger delete-user"
                              title={`Benutzer ${u.name} löschen`}
                              onClick={() => onDeleteUser(u)}
                            >
                              <i className="fa fa-trash-o"></i> Löschen
                            </button>
                          ),
                      },
                    ]}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

import * as React from "react";
import { useEffect, useState } from "react";
import { Meteor } from "meteor/meteor";
import { Link } from "react-router-dom";
import moment from "moment";

import { callMethod } from "../../../../imports/methods/MethodContracts";
import { UsageBucket, UsageReport } from "../../../../imports/statistics/UsageReport";
import { Routes } from "../../../../lib/client/routes";
import { InlineAlert, InlineAlerts } from "../../../react/components/InlineAlerts";

const MONTH_COUNT = 12;

/**
 * Admin-Dashboard "Statistik".
 *
 * "Auslastung" ist bewusst in zwei Kennzahlen getrennt (siehe UsageReport):
 * der **Besetzungsgrad** sagt, ob genug Verkündiger zusammenkommen, die
 * **Abschlussquote**, ob die Koordinatoren ihre Termine abarbeiten. Ein Monat
 * kann lauter geschlossene Termine haben und trotzdem halb leer sein.
 */

function formatRate(rate: number | null): string {
  // Kein Wert ist nicht dasselbe wie 0 % — ohne Sollzahl ist der
  // Besetzungsgrad schlicht nicht definiert.
  return rate === null ? "–" : `${Math.round(rate * 100)} %`;
}

function monthLabel(month: string): string {
  return moment(month, "YYYY-MM").format("MMM YY");
}

function rateClass(rate: number | null): string {
  if (rate === null) {
    return "text-muted";
  }
  if (rate >= 0.9) {
    return "text-success";
  }
  if (rate >= 0.6) {
    return "text-warning";
  }
  return "text-danger";
}

function SummaryCard(props: {
  panelClass: string;
  icon: string;
  value: string;
  label: string;
}): JSX.Element {
  return (
    <div className="col-lg-3 col-md-6">
      <div className={`card ${props.panelClass}`}>
        <div className="card-header">
          <div className="row">
            <div className="col-3">
              <i className={`fa ${props.icon} fa-4x`}></i>
            </div>
            <div className="col-9 text-right">
              <div className="huge">{props.value}</div>
              <div>{props.label}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricRow(props: {
  label: string;
  buckets: UsageBucket[];
  total: UsageBucket;
  read: (bucket: UsageBucket) => string;
  cellClass?: (bucket: UsageBucket) => string;
  strong?: boolean;
}): JSX.Element {
  // Kennzahlenzeilen (Besetzungsgrad, Abschlussquote) werden hervorgehoben,
  // die reinen Zählungen darüber nicht.
  const rowClass = props.strong ? "statistics-metric-strong" : undefined;

  return (
    <tr className={rowClass}>
      <td className="statistics-metric">{props.label}</td>
      {props.buckets.map((bucket) => (
        <td key={bucket.month} className={props.cellClass?.(bucket)}>
          {props.read(bucket)}
        </td>
      ))}
      <td className="statistics-total">{props.read(props.total)}</td>
    </tr>
  );
}

function GroupTable(props: {
  name: string;
  months: string[];
  buckets: UsageBucket[];
  total: UsageBucket;
}): JSX.Element {
  return (
    <div className="card card-primary">
      <div className="card-header">
        <h4 className="card-title">{props.name}</h4>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-sm table-striped statistics-table">
            <thead>
              <tr>
                <th></th>
                {props.months.map((month) => (
                  <th key={month}>{monthLabel(month)}</th>
                ))}
                <th className="statistics-total">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              <MetricRow
                label="Termine"
                buckets={props.buckets}
                total={props.total}
                read={(b) => String(b.assignments)}
              />
              <MetricRow
                label="davon offen"
                buckets={props.buckets}
                total={props.total}
                read={(b) => String(b.open)}
              />
              <MetricRow
                label="davon geschlossen"
                buckets={props.buckets}
                total={props.total}
                read={(b) => String(b.closed)}
              />
              <MetricRow
                label="davon abgesagt"
                buckets={props.buckets}
                total={props.total}
                read={(b) => String(b.canceled)}
              />
              <MetricRow
                label="Teilnahmen"
                buckets={props.buckets}
                total={props.total}
                read={(b) => String(b.participations)}
              />
              <MetricRow
                label="Besetzungsgrad"
                buckets={props.buckets}
                total={props.total}
                read={(b) => formatRate(b.occupancyRate)}
                cellClass={(b) => rateClass(b.occupancyRate)}
                strong
              />
              <MetricRow
                label="Abschlussquote"
                buckets={props.buckets}
                total={props.total}
                read={(b) => formatRate(b.closingRate)}
                cellClass={(b) => rateClass(b.closingRate)}
                strong
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Statistics(): JSX.Element {
  const [report, setReport] = useState<UsageReport | null>(null);
  const [alerts, setAlerts] = useState<InlineAlert[]>([]);

  useEffect(() => {
    callMethod("adminUsageReport", MONTH_COUNT)
      .then(setReport)
      .catch((err: Meteor.Error) =>
        setAlerts([
          {
            message: "Statistik konnte nicht geladen werden: " + (err.reason ?? err.message),
            type: "danger",
          },
        ]),
      );
  }, []);

  return (
    <div>
      <div className="row">
        <div className="col-lg-12">
          <h1 className="page-header">
            <Link className="btn btn-primary" to={Routes.path(Routes.Def.Home)}>
              <i className="fa fa-chevron-left fa-fw"></i>
            </Link>{" "}
            Statistik
            <small> letzte {MONTH_COUNT} Monate</small>
          </h1>
          <InlineAlerts alerts={alerts} />
        </div>
      </div>

      {!report && alerts.length === 0 ? (
        <div className="row">
          <div className="col-lg-12 huge text-center">
            <i className="fa fa-circle-o faa-burst fa-3x animated"></i>
          </div>
        </div>
      ) : null}

      {report ? (
        <React.Fragment>
          <div className="row">
            <SummaryCard
              panelClass="card-primary"
              icon="fa-calendar"
              value={String(report.overallTotal.assignments)}
              label="Termine"
            />
            <SummaryCard
              panelClass="card-green"
              icon="fa-users"
              value={String(report.overallTotal.participations)}
              label="Teilnahmen"
            />
            <SummaryCard
              panelClass="card-yellow"
              icon="fa-pie-chart"
              value={formatRate(report.overallTotal.occupancyRate)}
              label="Besetzungsgrad"
            />
            <SummaryCard
              panelClass="card-red"
              icon="fa-check-square-o"
              value={formatRate(report.overallTotal.closingRate)}
              label="Abschlussquote"
            />
          </div>

          <div className="row">
            <div className="col-lg-12">
              <GroupTable
                name="Alle Gruppen"
                months={report.months}
                buckets={report.overall}
                total={report.overallTotal}
              />
            </div>
          </div>

          <div className="row">
            <div className="col-lg-12">
              {report.groups
                // Gruppen ohne einen einzigen Termin im Zeitraum blähen die
                // Seite auf, ohne etwas auszusagen.
                .filter((group) => group.total.assignments > 0)
                .map((group) => (
                  <GroupTable
                    key={group.groupId}
                    name={group.groupName}
                    months={report.months}
                    buckets={group.buckets}
                    total={group.total}
                  />
                ))}
            </div>
          </div>
        </React.Fragment>
      ) : null}
    </div>
  );
}

import * as React from "react";
import { useState } from "react";
import { Meteor } from "meteor/meteor";
import moment from "moment";
import { Routes } from "../../../lib/client/routes";

import * as ServerMethodsWrapper from "../../../lib/classes/ServerMethodsWrapper";
import { InlineAlert, InlineAlerts } from "../../react/components/InlineAlerts";
import MultiSelect from "../../react/components/MultiSelect";

interface Week {
  week: number;
  formattedWeek: string;
  year: number;
}

function generateWeeks(startWeek: number, endWeek: number, currentYear: number): Week[] {
  const weeks: Week[] = [];
  for (let i = startWeek; i <= endWeek; i++) {
    const startOfWeek = moment().year(currentYear).isoWeek(i).startOf("isoWeek");
    const endOfWeek = moment().year(currentYear).isoWeek(i).endOf("isoWeek");

    weeks.push({
      week: i,
      formattedWeek: `KW ${i} (${startOfWeek.format("DD.MM")} - ${endOfWeek.format("DD.MM")}, ${currentYear})`,
      year: currentYear,
    });
  }
  return weeks;
}

function generateWeeksByAmount(startWeek: number, startYear: number, amount: number): Week[] {
  const weeks: Week[] = [];
  let currentWeek = startWeek;
  let currentYear = startYear;
  let weeksLeft = amount;

  while (weeksLeft > 0) {
    const weeksInYear = moment().year(currentYear).isoWeeksInYear();
    const weeksToGenerate = Math.min(weeksLeft, weeksInYear - currentWeek + 1);

    weeks.push(...generateWeeks(currentWeek, currentWeek + weeksToGenerate - 1, currentYear));

    currentWeek = 1;
    currentYear++;
    weeksLeft -= weeksToGenerate;
  }

  return weeks;
}

function selectWeeks(
  startWeek: number,
  startYear: number,
  endWeek: number,
  endYear: number,
): string[] {
  const weeks: string[] = [];
  let currentWeek = startWeek;
  let currentYear = startYear;

  while (currentYear < endYear || (currentYear === endYear && currentWeek <= endWeek)) {
    weeks.push(`${currentWeek}/${currentYear}`);
    currentWeek++;
    if (currentWeek > moment().year(currentYear).isoWeeksInYear()) {
      currentWeek = 1;
      currentYear++;
    }
  }

  return weeks;
}

export default function CopyAssignments(): JSX.Element {
  const currentIsoWeek = moment().isoWeek();
  const currentYear = moment().year();

  const allWeeks = generateWeeksByAmount(1, currentYear, moment().isoWeeksInYear() + 4);
  const futureWeeks = generateWeeksByAmount(currentIsoWeek, currentYear, moment().isoWeeksInYear());

  const [fromWeek, setFromWeek] = useState(`${currentIsoWeek}/${currentYear}`);
  const [toWeeks, setToWeeks] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<InlineAlert[]>([]);

  const futureWeekOptions = futureWeeks.map((w) => ({
    label: w.formattedWeek,
    value: `${w.week}/${w.year}`,
  }));

  const onQuickAction = (timeframe: string) => {
    let startWeek: moment.Moment;
    let endWeek: moment.Moment;

    switch (timeframe) {
      case "nextMonth":
        startWeek = moment().add(1, "months").startOf("month");
        endWeek = moment().add(1, "months").endOf("month");
        break;
      case "restOfMonth":
        startWeek = moment().add(1, "week").startOf("week");
        endWeek = moment().endOf("month");
        break;
      case "restOfQuarter":
        startWeek = moment().add(1, "week").startOf("week");
        endWeek = moment().endOf("quarter");
        break;
      case "restOfYear":
        startWeek = moment().add(1, "week").startOf("week");
        endWeek = moment().endOf("year");
        break;
      default:
        return;
    }

    const selected = selectWeeks(
      startWeek.isoWeek(),
      startWeek.year(),
      endWeek.isoWeek(),
      endWeek.year(),
    );
    // Only offer weeks that exist in the options list.
    setToWeeks(selected.filter((v) => futureWeekOptions.some((o) => o.value === v)));
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAlerts([]);

    const [week, year] = fromWeek.split("/");
    const from = { week: parseInt(week, 10), year: parseInt(year, 10) };
    const targets = toWeeks.map((v) => {
      const [w, y] = v.split("/");
      return { week: parseInt(w, 10), year: parseInt(y, 10) };
    });

    const proxy = new ServerMethodsWrapper.GroupProxy(Routes.getParam("groupId"));
    let totalCopied = 0;
    let errors = "";

    const displaySummaryAlerts = () => {
      const next: InlineAlert[] = [];
      if (errors) {
        next.push({ message: errors, type: "danger" });
      }
      if (totalCopied) {
        next.push({
          message: `Aus aus KW ${from.week} ${from.year} wurden insgesamt ${totalCopied} Einsätze nach ${targets.length} Wochen kopiert.`,
          type: "success",
        });
      }
      setAlerts(next);
    };

    const processAll = async () => {
      for (const toWeek of targets) {
        try {
          const copied = await proxy.copyAssignmentWeek({
            from: { calendarWeek: from.week, year: from.year },
            to: { calendarWeek: toWeek.week, year: toWeek.year },
          });
          totalCopied += copied;
        } catch (err: any) {
          console.error("Fehler beim kopieren:", err);
          errors += `Fehler beim kopieren von KW ${from.week} ${from.year} nach KW ${toWeek.week} ${toWeek.year}: ${err.reason}\n`;
        }
      }
      displaySummaryAlerts();
    };

    processAll();
  };

  return (
    <div className="col-lg-10">
      <h1 className="page-header">Einsätze von Kalenderwoche kopieren</h1>
      <p>
        Wählen Sie die Kalenderwoche, deren Einsätze Sie kopieren möchten, und die Zielwochen aus.
        Die verfügbaren Schnellauswahl-Buttons ermöglichen eine einfache Auswahl von bestimmten
        Zeiträumen.
      </p>
      <p>Aktuelle Kalenderwoche: {currentIsoWeek}</p>

      <form acceptCharset="UTF-8" role="form" id="copy" onSubmit={onSubmit}>
        <fieldset>
          <div className="form-group">
            <label htmlFor="fromWeek">Von Kalenderwoche</label>
            <select
              className="form-control"
              name="fromWeek"
              id="fromWeek"
              value={fromWeek}
              onChange={(e) => setFromWeek(e.target.value)}
            >
              {allWeeks.map((w) => (
                <option key={`${w.week}/${w.year}`} value={`${w.week}/${w.year}`}>
                  {w.formattedWeek}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="toWeek">Nach Kalenderwoche</label>
            <div id="toWeek">
              <MultiSelect
                inputId="toWeekSelect"
                options={futureWeekOptions}
                value={toWeeks}
                onChange={setToWeeks}
              />
            </div>
            <div className="mt-3" style={{ marginTop: "20px" }}>
              <div className="row">
                <div className="col-12 col-md-3 mb-2">
                  <button
                    type="button"
                    className="btn btn-primary btn-block quick-action"
                    onClick={() => onQuickAction("nextMonth")}
                  >
                    Nächster Monat
                  </button>
                </div>
                <div className="col-12 col-md-3 mb-2">
                  <button
                    type="button"
                    className="btn btn-primary btn-block quick-action"
                    onClick={() => onQuickAction("restOfMonth")}
                  >
                    Rest des aktuellen Monats
                  </button>
                </div>
                <div className="col-12 col-md-3 mb-2">
                  <button
                    type="button"
                    className="btn btn-primary btn-block quick-action"
                    onClick={() => onQuickAction("restOfQuarter")}
                  >
                    Rest des Quartals
                  </button>
                </div>
                <div className="col-12 col-md-3 mb-2">
                  <button
                    type="button"
                    className="btn btn-primary btn-block quick-action"
                    onClick={() => onQuickAction("restOfYear")}
                  >
                    Rest des Jahres
                  </button>
                </div>
              </div>
            </div>
          </div>

          <input
            id="copySubmit"
            className="btn btn-lg btn-success btn-block"
            type="submit"
            value="Kopieren"
          />
        </fieldset>
      </form>
      <InlineAlerts alerts={alerts} />
    </div>
  );
}

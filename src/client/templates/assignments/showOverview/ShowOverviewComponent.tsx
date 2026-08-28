import * as React from "react";
import { useMemo, useState } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import * as _ from "underscore";
import moment from "moment";
import DatePicker, { registerLocale } from "react-datepicker";
import { de } from "date-fns/locale";
import { Routes } from "../../../../lib/client/routes";
import { Link } from "react-router-dom";

import { AssignmentDAO, Assignments } from "../../../../collections/lib/AssignmentsCollection";
import Assignment from "../../../../collections/lib/classes/Assignment";
import Group from "../../../../collections/lib/classes/Group";
import User from "../../../../collections/lib/classes/User";
import { Groups } from "../../../../collections/lib/GroupCollection";
import { useCachedSubscription } from "../../../react/lib/useCachedSubscription";

import AssignmentPanel from "./AssignmentPanel";
import AssignmentCalendar from "./AssignmentCalendar";

// Explizit hier registrieren statt auf die Modul-Auswertungsreihenfolge
// anderer Seiten zu vertrauen; registerLocale ist idempotent.
registerLocale("de", de);

type FilterState = "all" | "own" | "readyForClose";
type ViewMode = "list" | "calendar";

const VIEW_MODE_STORAGE_KEY = "assignmentOverview.viewMode";
const DAY_KEY_FORMAT = "YYYY-MM-DD";

function getSelectedMonth(): moment.Moment {
  const yearMonth = Routes.getParam("yearMonth");
  return yearMonth ? moment(yearMonth, Assignment.MonthStringFormat) : moment();
}

function assignmentSelector(
  groupId: string,
  filter: FilterState,
  month: moment.Moment,
  isoWeek?: number,
): any {
  let selector: any = {
    group: groupId,
    year: month.year(),
    month: month.month(),
    end: { $gte: moment().startOf("day").toDate() },
  };

  if (filter === "own") {
    const userId = Meteor.userId();
    selector = _.extend(selector, {
      $or: [{ "applicants.user": userId }, { "participants.user": userId }],
    });
  }

  if (filter === "readyForClose") {
    selector = _.extend(selector, {
      $where: "(this.applicants.length + this.participants.length) >= this.userGoal",
      state: "Online",
    });
  }

  if (!_.isUndefined(isoWeek)) {
    selector = _.extend(selector, { isoWeek });
  }

  return selector;
}

function readStoredViewMode(): ViewMode {
  try {
    return window.localStorage.getItem(VIEW_MODE_STORAGE_KEY) === "calendar" ? "calendar" : "list";
  } catch {
    // Privater Modus / blockierte Site-Daten: Liste ist der sichere Standard.
    return "list";
  }
}

function storeViewMode(mode: ViewMode): void {
  try {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // Nicht persistieren zu können ist kein Grund, die Ansicht nicht zu wechseln.
  }
}

function weekHeading(isoWeek: number, year: number, month: moment.Moment): string {
  const week = moment().year(year).isoWeek(isoWeek).startOf("isoWeek");
  const formatPattern = "Do MMMM";
  const firstDayOfIsoWeek = week.clone().startOf("isoWeek");
  const lastDayOfIsoWeek = week.clone().endOf("isoWeek");
  const firstDayOfMonth = month.clone().startOf("month");
  const lastDayOfMonth = month.clone().endOf("month");

  const firstDay = firstDayOfIsoWeek.isBefore(firstDayOfMonth)
    ? firstDayOfMonth
    : firstDayOfIsoWeek;
  const lastDay = lastDayOfIsoWeek.isAfter(lastDayOfMonth) ? lastDayOfMonth : lastDayOfIsoWeek;

  if (firstDay.isSame(lastDay, "day")) {
    return firstDay.format(formatPattern);
  }
  return `${firstDay.format(formatPattern)} bis ${lastDay.format(formatPattern)}`;
}

function AssignmentWeekView(props: {
  isoWeek: number;
  year: number;
  groupId: string;
  filter: FilterState;
  month: moment.Moment;
  canModify: boolean;
}): JSX.Element {
  const [collapsed, setCollapsed] = useState(true);
  const [renderedOnce, setRenderedOnce] = useState(false);

  const monthKey = props.month.format(Assignment.MonthStringFormat);
  const assignments = useTracker(
    () =>
      renderedOnce
        ? Assignments.find(
            assignmentSelector(props.groupId, props.filter, props.month, props.isoWeek),
            { sort: { start: 1, name: 1, _id: 1 } },
          ).fetch()
        : [],
    [props.groupId, props.filter, props.isoWeek, monthKey, renderedOnce],
  );

  const onHeadingClick = () => {
    if (collapsed) {
      setRenderedOnce(true);
    }
    setCollapsed(!collapsed);
  };

  return (
    <div className="card card-primary">
      <div className="card-header" style={{ cursor: "pointer" }} onClick={onHeadingClick}>
        <h4 className="card-title">
          <i
            className={`fa ${!collapsed ? "fa-chevron-circle-down" : "fa-chevron-circle-right"}`}
          ></i>{" "}
          {weekHeading(props.isoWeek, props.year, props.month)}
        </h4>
      </div>
      <div
        id={`accordion_${props.isoWeek}`}
        className={`collapse-wrapper collapse weekViewCollapse${collapsed ? "" : " show"}`}
        style={{ display: collapsed ? "none" : "block" }}
      >
        <div className="card-body">
          {renderedOnce ? (
            <div className="row">
              {assignments.map((a: AssignmentDAO) => (
                <AssignmentPanel key={a._id} assignment={a} canModify={props.canModify} />
              ))}
            </div>
          ) : (
            <div className="col-lg-12 huge text-center">
              <i className="fa fa-circle-o faa-burst fa-3x animated"></i>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AssignmentList(props: { assignments: AssignmentDAO[]; canModify: boolean }): JSX.Element {
  return (
    <React.Fragment>
      {props.assignments.map((a) => (
        <AssignmentPanel key={a._id} assignment={a} canModify={props.canModify} />
      ))}
    </React.Fragment>
  );
}

export default function ShowOverview(): JSX.Element {
  const [filter, setFilter] = useState<FilterState>("all");
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredViewMode);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Route-Parameter separat verfolgen: sie ändern sich selten, hängen aber an
  // keiner Collection — im selben Tracker wie die Termine würden sie bei jeder
  // Bewerbung mit neu ausgewertet.
  const route = useTracker(() => ({
    groupId: Routes.getParam("groupId"),
    month: getSelectedMonth(),
  }));
  const groupId = route.groupId;
  const month = route.month;
  const yearMonth = Assignment.convertDateToMonthString(month);

  const ready = useCachedSubscription("assignmentsInMonthPerGroup", groupId, yearMonth);

  // Eigener Tracker: hängt an Groups und Meteor.users, nicht an den Terminen.
  const group = useTracker(() => {
    const groupDoc = Groups.findOne({ _id: groupId });
    return {
      name: groupDoc?.name ?? "",
      // Das Gruppendokument kann beim Kaltstart noch fehlen.
      isCoordinator: groupDoc
        ? new User(Meteor.userId()!).isGroupCoordinator(new Group(groupId))
        : false,
    };
  }, [groupId]);

  const isAdmin = useTracker(() => {
    const userId = Meteor.userId();
    return userId ? new User(userId).isAdmin() : false;
  }, []);

  const canModify = isAdmin || group.isCoordinator;

  // Nur die Wochennummern — ein projizierter map() statt eines fetch() aller
  // Dokumente, das früher zusätzlich lief.
  const isoWeeks = useTracker(
    () =>
      _.unique(
        Assignments.find(assignmentSelector(groupId, filter, month), {
          fields: { isoWeek: 1, yearOfIsoWeek: 1 },
          sort: [["start", "asc"]] as any,
        }).map((a: AssignmentDAO) => ({ number: a.isoWeek, year: a.yearOfIsoWeek })),
        (item: any) => item.number,
      ),
    [groupId, filter, yearMonth],
  );

  // Die vollen Dokumente werden nur geholt, wo sie auch gerendert werden:
  // in der Kalenderansicht und in den flachen Filterlisten. Die
  // Wochen-Akkordeons holen sich ihre Termine selbst.
  const needsFlatList = viewMode === "calendar" || filter !== "all";
  const assignments = useTracker(
    () =>
      needsFlatList
        ? Assignments.find(assignmentSelector(groupId, filter, month), {
            sort: { start: 1, name: 1, _id: 1 },
          }).fetch()
        : [],
    [groupId, filter, yearMonth, needsFlatList],
  );

  const hasAssignments = useTracker(
    () => Assignments.find(assignmentSelector(groupId, filter, month)).count() > 0,
    [groupId, filter, yearMonth],
  );

  const daysAssignments = useMemo(
    () =>
      selectedDay === null
        ? assignments
        : assignments.filter((a) => moment(a.start).format(DAY_KEY_FORMAT) === selectedDay),
    [assignments, selectedDay],
  );

  const months = Array.from({ length: 4 }, (_unused, i) => moment().add(i, "month"));

  const onViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    storeViewMode(mode);
    if (mode === "list") {
      setSelectedDay(null);
    }
  };

  // Sprung auf einen bestimmten Tag: liegt er in einem anderen Monat, wechselt
  // die Route mit — sonst zeigte der Kalender einen Tag, den er nicht enthält.
  const onJumpToDay = (date: Date | null) => {
    if (!date) {
      setSelectedDay(null);
      return;
    }
    const target = moment(date);
    setViewMode("calendar");
    storeViewMode("calendar");
    setSelectedDay(target.format(DAY_KEY_FORMAT));

    const targetMonth = Assignment.convertDateToMonthString(target);
    if (targetMonth !== yearMonth) {
      Routes.go(Routes.Def.AssignmentOverview, { groupId, yearMonth: targetMonth });
    }
  };

  const paginator = (
    <ul className="pagination">
      {months.map((m) => {
        const monthYear = Assignment.convertDateToMonthString(m);
        return (
          <li key={monthYear} className={monthYear === yearMonth ? "active" : ""}>
            <Link
              to={Routes.path(Routes.Def.AssignmentOverview, { groupId, yearMonth: monthYear })}
              onClick={() => setSelectedDay(null)}
            >
              {m.format("MMM YY")}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div>
      <div className="row">
        <div className="col-lg-12">
          <h1 className="page-header">
            <Link className="btn btn-primary" to={Routes.path(Routes.Def.Home)}>
              <i className="fa fa-chevron-left fa-fw"></i>
            </Link>{" "}
            Termine
            <small> {group.name}</small>
          </h1>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-12 assignmentNav">
          {paginator}

          <div className="pagination btn-group" data-bs-toggle="buttons">
            <label
              className={`btn btn-primary ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              <input
                type="radio"
                name="options"
                id="filter-all"
                autoComplete="off"
                readOnly
                checked={filter === "all"}
              />{" "}
              Alle <i className="fa fa-calendar"></i>
              {filter === "all" ? <i className="fa fa-check"></i> : null}
            </label>
            <label
              className={`btn btn-success ${filter === "own" ? "active" : ""}`}
              onClick={() => setFilter("own")}
            >
              <input
                type="radio"
                name="options"
                id="filter-mine"
                autoComplete="off"
                readOnly
                checked={filter === "own"}
              />
              {filter === "own" ? <i className="fa fa-check"></i> : null} Meine{" "}
              <i className="fa fa-calendar"></i>
            </label>
            {group.isCoordinator ? (
              <label
                className={`btn btn-info ${filter === "readyForClose" ? "active" : ""}`}
                onClick={() => setFilter("readyForClose")}
              >
                <input
                  type="radio"
                  name="options"
                  id="filter-ready-for-close"
                  autoComplete="off"
                  readOnly
                  checked={filter === "readyForClose"}
                />{" "}
                Volle <i className="fa fa-calendar"></i>{" "}
                {filter === "readyForClose" ? <i className="fa fa-check"></i> : null}
              </label>
            ) : null}
          </div>

          <div className="pagination btn-group" data-bs-toggle="buttons">
            <label
              className={`btn btn-secondary ${viewMode === "list" ? "active" : ""}`}
              onClick={() => onViewModeChange("list")}
            >
              <input
                type="radio"
                name="viewMode"
                id="view-list"
                autoComplete="off"
                readOnly
                checked={viewMode === "list"}
              />{" "}
              Liste <i className="fa fa-list"></i>
            </label>
            <label
              className={`btn btn-secondary ${viewMode === "calendar" ? "active" : ""}`}
              onClick={() => onViewModeChange("calendar")}
            >
              <input
                type="radio"
                name="viewMode"
                id="view-calendar"
                autoComplete="off"
                readOnly
                checked={viewMode === "calendar"}
              />{" "}
              Kalender <i className="fa fa-calendar-o"></i>
            </label>
          </div>

          <div className="pagination assignment-day-picker">
            <DatePicker
              id="jump-to-day"
              selected={selectedDay ? moment(selectedDay, DAY_KEY_FORMAT).toDate() : null}
              onChange={onJumpToDay}
              minDate={moment().startOf("day").toDate()}
              dateFormat="dd.MM.yyyy"
              placeholderText="Tag suchen"
              locale="de"
              className="form-control form-control-sm"
              isClearable
            />
          </div>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <div className="row">
          <div className="col-lg-12">
            {ready ? (
              <AssignmentCalendar
                assignments={assignments}
                month={month}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />
            ) : null}
          </div>
          {ready && daysAssignments.length > 0 ? (
            <AssignmentList assignments={daysAssignments} canModify={canModify} />
          ) : null}
          {ready && daysAssignments.length === 0 ? (
            <div className="col-lg-12">
              <div className="alert alert-info" role="alert">
                <strong>
                  <i className="fa fa-info-circle"></i>{" "}
                  {selectedDay
                    ? `Am ${moment(selectedDay, DAY_KEY_FORMAT).format("LL")} ist kein Termin vorhanden.`
                    : "Keine Termine vorhanden."}
                </strong>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {viewMode === "list" && filter === "readyForClose" ? (
        <div className="row">
          {ready ? (
            hasAssignments ? (
              <AssignmentList assignments={assignments} canModify={canModify} />
            ) : (
              <div className="col-lg-12">
                <div className="alert alert-info" role="alert">
                  <strong>
                    <i className="fa fa-info-circle"></i> Kein voller und offener Termin für diesen
                    Monat vorhanden.
                  </strong>
                </div>
              </div>
            )
          ) : null}
        </div>
      ) : null}

      {viewMode === "list" && filter === "own" ? (
        <div className="row">
          {ready ? (
            hasAssignments ? (
              <AssignmentList assignments={assignments} canModify={canModify} />
            ) : (
              <div className="col-lg-12">
                <div className="alert alert-success" role="alert">
                  <strong>
                    <i className="fa fa-info-circle"></i> Kein eigener Termin vorhanden.
                  </strong>{" "}
                  Du hast dich im gewählten Monat auf keinen Termin beworben und nimmst noch an
                  keinem teil.
                  <strong>
                    {" "}
                    Klicke oben auf "Alle <i className="fa fa-calendar"></i>"
                  </strong>
                  , um dir einen Termin auszusuchen.
                </div>
              </div>
            )
          ) : null}
        </div>
      ) : null}

      {viewMode === "list" && filter === "all" ? (
        <div className="row">
          {!hasAssignments ? (
            <div className="col-lg-12">
              <div className="alert alert-info" role="alert">
                <strong>
                  <i className="fa fa-exclamation-circle"></i> Keine Termine vorhanden.
                </strong>{" "}
                Im gewählten Monat sind keine Termine verfügbar.
              </div>
            </div>
          ) : (
            <div className="col-lg-12">
              <div className="accordion" id="accordion">
                {isoWeeks.map((w: any) => (
                  <AssignmentWeekView
                    key={`${yearMonth}-${w.number}`}
                    isoWeek={w.number}
                    year={w.year}
                    groupId={groupId}
                    filter={filter}
                    month={month}
                    canModify={canModify}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

import * as React from "react";
import { useState } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import * as _ from "underscore";
import * as moment from "moment";
import { Routes } from "../../../../lib/client/routes";
import { Link } from "react-router-dom";

import { AssignmentDAO, Assignments } from "../../../../collections/lib/AssignmentsCollection";
import Assignment from "../../../../collections/lib/classes/Assignment";
import Group from "../../../../collections/lib/classes/Group";
import User from "../../../../collections/lib/classes/User";
import { Groups } from "../../../../collections/lib/GroupCollection";

import AssignmentPanel from "./AssignmentPanel";

type FilterState = "all" | "own" | "readyForClose";

function getSelectedMonth(): moment.Moment {
  const yearMonth = Routes.getParam("yearMonth");
  return yearMonth ? moment(yearMonth, Assignment.MonthStringFormat) : moment();
}

function assignmentSelector(groupId: string, filter: FilterState, isoWeek?: number): any {
  const date = getSelectedMonth();
  let selector: any = {
    group: groupId,
    year: date.year(),
    month: date.month(),
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

function weekHeading(isoWeek: number, year: number): string {
  const week = moment().year(year).isoWeek(isoWeek).startOf("isoWeek");
  const month = getSelectedMonth().startOf("month");
  const formatPattern = "Do MMMM";
  const firstDayOfIsoWeek = week.clone().startOf("isoWeek");
  const lastDayOfIsoWeek = week.clone().endOf("isoWeek");
  const firstDayOfMonth = month.clone().startOf("month");
  const lastDayOfMonth = month.clone().endOf("month");

  const firstDay = firstDayOfIsoWeek.isBefore(firstDayOfMonth) ? firstDayOfMonth : firstDayOfIsoWeek;
  const lastDay = lastDayOfIsoWeek.isAfter(lastDayOfMonth) ? lastDayOfMonth : lastDayOfIsoWeek;

  if (firstDay.isSame(lastDay, "day")) {
    return firstDay.format(formatPattern);
  }
  return `${firstDay.format(formatPattern)} bis ${lastDay.format(formatPattern)}`;
}

function AssignmentWeekView(props: { isoWeek: number; year: number; groupId: string; filter: FilterState }): JSX.Element {
  const [collapsed, setCollapsed] = useState(true);
  const [renderedOnce, setRenderedOnce] = useState(false);

  const assignments = useTracker(
    () =>
      renderedOnce
        ? Assignments.find(assignmentSelector(props.groupId, props.filter, props.isoWeek), {
            sort: { start: 1, name: 1, _id: 1 },
          }).fetch()
        : [],
    [props.groupId, props.filter, props.isoWeek, renderedOnce],
  );

  const onHeadingClick = () => {
    if (collapsed) {
      setRenderedOnce(true);
    }
    setCollapsed(!collapsed);
  };

  return (
    <div className="panel panel-primary">
      <div className="panel-heading" style={{ cursor: "pointer" }} onClick={onHeadingClick}>
        <h4 className="panel-title">
          <i className={`fa ${!collapsed ? "fa-chevron-circle-down" : "fa-chevron-circle-right"}`}></i> {weekHeading(props.isoWeek, props.year)}
        </h4>
      </div>
      <div
        id={`accordion_${props.isoWeek}`}
        className={`panel-collapse collapse weekViewCollapse${collapsed ? "" : " in"}`}
        style={{ display: collapsed ? "none" : "block" }}
      >
        <div className="panel-body">
          {renderedOnce ? (
            <div className="row">
              {assignments.map((a: AssignmentDAO) => (
                <div key={a._id}>
                  <AssignmentPanel assignment={a} />
                </div>
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

export default function ShowOverview(): JSX.Element {
  const [filter, setFilter] = useState<FilterState>("all");

  const data = useTracker(() => {
    const groupId = Routes.getParam("groupId");
    const yearMonth = Assignment.convertDateToMonthString(getSelectedMonth());
    const handle = Meteor.subscribe("assignmentsInMonthPerGroup", groupId, yearMonth);

    const isoWeeks = _.unique(
      Assignments.find(assignmentSelector(groupId, filter), {
        fields: { isoWeek: 1, yearOfIsoWeek: 1 },
        sort: [["start", "asc"]] as any,
      }).map((a: AssignmentDAO) => ({ number: a.isoWeek, year: a.yearOfIsoWeek })),
      (item: any) => item.number,
    );

    const groupDoc = Groups.findOne({ _id: groupId });

    return {
      groupId,
      yearMonth,
      ready: handle.ready(),
      groupName: groupDoc?.name ?? "",
      // The group doc may not be delivered yet on a cold load.
      isCoordinator: groupDoc ? new User(Meteor.userId()).isGroupCoordinator(new Group(groupId)) : false,
      assignments: Assignments.find(assignmentSelector(groupId, filter), {
        sort: { start: 1, name: 1, _id: 1 },
      }).fetch(),
      isoWeeks,
    };
  }, [filter]);

  const months = Array.from({ length: 4 }, (_unused, i) => moment().add(i, "month"));

  const paginator = (
    <ul className="pagination">
      {months.map((month) => {
        const monthYear = Assignment.convertDateToMonthString(month);
        return (
          <li key={monthYear} className={monthYear === data.yearMonth ? "active" : ""}>
            <Link to={Routes.path(Routes.Def.AssignmentOverview, { groupId: data.groupId, yearMonth: monthYear })}>
              {month.format("MMM YY")}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const hasAssignments = data.assignments.length > 0;

  return (
    <div>
      <div className="row">
        <div className="col-lg-12">
          <h1 className="page-header">
            <Link className="btn btn-primary" to={Routes.path(Routes.Def.Home)}><i className="fa fa-chevron-left fa-fw"></i></Link> Termine
            <small> {data.groupName}</small>
          </h1>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-12 assignmentNav">
          {paginator}

          <div className="pagination btn-group" data-toggle="buttons">
            <label className={`btn btn-primary ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
              <input type="radio" name="options" id="filter-all" autoComplete="off" readOnly checked={filter === "all"} /> Alle <i className="fa fa-calendar"></i>
              {filter === "all" ? <i className="fa fa-check"></i> : null}
            </label>
            <label className={`btn btn-success ${filter === "own" ? "active" : ""}`} onClick={() => setFilter("own")}>
              <input type="radio" name="options" id="filter-mine" autoComplete="off" readOnly checked={filter === "own"} />
              {filter === "own" ? <i className="fa fa-check"></i> : null}
              {" "}Meine <i className="fa fa-calendar"></i>
            </label>
            {data.isCoordinator ? (
              <label className={`btn btn-info ${filter === "readyForClose" ? "active" : ""}`} onClick={() => setFilter("readyForClose")}>
                <input type="radio" name="options" id="filter-ready-for-close" autoComplete="off" readOnly checked={filter === "readyForClose"} />
                {" "}Volle <i className="fa fa-calendar"></i> {filter === "readyForClose" ? <i className="fa fa-check"></i> : null}
              </label>
            ) : null}
          </div>
        </div>
      </div>

      {filter === "readyForClose" ? (
        <div className="row">
          {data.ready ? (
            hasAssignments ? (
              data.assignments.map((a: AssignmentDAO) => (
                <div key={a._id}>
                  <AssignmentPanel assignment={a} />
                </div>
              ))
            ) : (
              <div className="col-lg-12">
                <div className="alert alert-info" role="alert">
                  <strong><i className="fa fa-info-circle"></i> Kein voller und offener Termin für diesen Monat vorhanden.</strong>
                </div>
              </div>
            )
          ) : null}
        </div>
      ) : null}

      {filter === "own" ? (
        <div className="row">
          {data.ready ? (
            hasAssignments ? (
              data.assignments.map((a: AssignmentDAO) => (
                <div key={a._id}>
                  <AssignmentPanel assignment={a} />
                </div>
              ))
            ) : (
              <div className="col-lg-12">
                <div className="alert alert-success" role="alert">
                  <strong><i className="fa fa-info-circle"></i> Kein eigener Termin vorhanden.</strong> Du hast dich im gewählten Monat auf keinen Termin beworben und nimmst noch an keinem teil.
                  <strong> Klicke oben auf "Alle <i className="fa fa-calendar"></i>"</strong>, um dir einen Termin auszusuchen.
                </div>
              </div>
            )
          ) : null}
        </div>
      ) : null}

      {filter === "all" ? (
        <div className="row">
          {!hasAssignments ? (
            <div className="col-lg-12">
              <div className="alert alert-info" role="alert">
                <strong><i className="fa fa-exclamation-circle"></i> Keine Termine vorhanden.</strong> Im gewählten Monat sind keine Termine verfügbar.
              </div>
            </div>
          ) : (
            <div className="panel-group" id="accordion">
              {data.isoWeeks.map((w: any) => (
                <AssignmentWeekView
                  key={`${data.yearMonth}-${w.number}`}
                  isoWeek={w.number}
                  year={w.year}
                  groupId={data.groupId}
                  filter={filter}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {data.ready && hasAssignments ? (
        <div className="row">
          <div className="col-lg-12">
            {paginator}
          </div>
        </div>
      ) : null}
    </div>
  );
}

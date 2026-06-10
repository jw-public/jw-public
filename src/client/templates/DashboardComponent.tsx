import * as React from "react";
import { useEffect, useState } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import * as _ from "underscore";
import { Routes } from "../../lib/client/routes";

import * as moment from "moment";

import Assignment from "../../collections/lib/classes/Assignment";
import AssignmentCountAccessor from "../../collections/lib/classes/AssignmentCountAccessor";
import Group, { GroupApplicationController } from "../../collections/lib/classes/Group";
import User from "../../collections/lib/classes/User";

import { getUserDataSubscription } from "../../subscribe";

interface DashboardPanelData {
  panelClass: string;
  fontAwesomeIcon: string;
  hugeContent: string;
  smallContent: string;
  footerDescription: string;
  showLink: boolean;
  link: string;
}

function DashboardPanel(props: DashboardPanelData): JSX.Element {
  const footer = (
    <div className="panel-footer">
      <span className="pull-left">{props.footerDescription}</span>
      {props.showLink ? (
        <span className="pull-right"><i className="fa fa-arrow-circle-right"></i></span>
      ) : null}
      <div className="clearfix"></div>
    </div>
  );

  return (
    <div className="col-lg-4 col-md-6">
      <div className={`panel ${props.panelClass}`}>
        <div className="panel-heading">
          <div className="row">
            <div className="col-xs-3">
              <i className={`fa ${props.fontAwesomeIcon} fa-5x`}></i>
            </div>
            <div className="col-xs-9 text-right">
              <div className="huge">
                {_.isEmpty(props.hugeContent) ? (
                  <i className="fa fa-spinner fa-pulse"></i>
                ) : (
                  props.hugeContent
                )}
              </div>
              <div>{props.smallContent}</div>
            </div>
          </div>
        </div>
        {props.showLink ? <a href={props.link}>{footer}</a> : footer}
      </div>
    </div>
  );
}

function useUserCount(loggedIn: boolean): string {
  const [userCount, setUserCount] = useState("");

  useEffect(() => {
    if (!loggedIn) {
      return;
    }
    Meteor.call("getAllUsersCount", (err: Meteor.Error, asyncValue: number) => {
      if (err) {
        console.log(err);
      } else {
        setUserCount(String(asyncValue));
      }
    });
  }, [loggedIn]);

  return userCount;
}

export default function Dashboard(): JSX.Element {
  const loggedIn = useTracker(() => !!Meteor.userId(), []);
  const userCount = useUserCount(loggedIn);

  const data = useTracker(() => {
    const userDAO = Meteor.user();

    if (_.isUndefined(userDAO) || _.isNull(userDAO)) {
      return {
        greeting: "Hallo, hier ist deine Übersicht",
        trolleyPanels: [] as DashboardPanelData[],
        coordinatorPanels: [] as DashboardPanelData[],
        ownPendingPanels: [] as DashboardPanelData[],
        isAdmin: false,
      };
    }

    const user = User.createFromDAO(userDAO);

    // --- Termine pro Gruppe (counts need their subscription per group) ------
    const trolleyPanels: DashboardPanelData[] = [];
    if (getUserDataSubscription().ready()) {
      const groupIds = user.getGroupIdsReactive() || [];
      const handles = groupIds.map((groupId) =>
        new AssignmentCountAccessor(groupId).subscribeCount(),
      );
      if (handles.every((h) => h.ready())) {
        _.forEach(groupIds, (groupId) => {
          const group = new Group(groupId);
          const assignmentCount = new AssignmentCountAccessor(groupId).count;
          const hasAssignments = assignmentCount > 0;

          trolleyPanels.push({
            panelClass: "panel-primary",
            fontAwesomeIcon: "fa-pencil-square-o",
            hugeContent: assignmentCount.toString(),
            smallContent: "Termine in " + group.name + "",
            showLink: hasAssignments,
            link: hasAssignments
              ? Routes.path(
                  Routes.Def.AssignmentOverview,
                  { groupId: group.getId(), yearMonth: Assignment.convertDateToMonthString(moment()) },
                )
              : null,
            footerDescription: hasAssignments
              ? "Zur Terminansicht"
              : "Bald werden wieder Termine verfügbar sein.",
          });
        });
      }
    }

    // --- Offene Gruppenbewerbungen für Koordinatoren -------------------------
    const coordinatorPanels: DashboardPanelData[] = [];
    const coordinatingGroups = user.getCoordinatingGroups(true) || [];
    _.forEach(coordinatingGroups, (group: Group) => {
      const applicationsCount = new GroupApplicationController(group.getId()).applicationsCount;
      if (applicationsCount > 0) {
        coordinatorPanels.push({
          panelClass: "panel-red",
          fontAwesomeIcon: "fa-list-alt",
          hugeContent: applicationsCount.toString(),
          smallContent: "Gruppenanfrage(n) für " + group.name + "",
          footerDescription: "Bewerbungen bearbeiten",
          showLink: true,
          link: Routes.path(Routes.Def.GroupApplicants, { groupId: group.getId() }),
        });
      }
    });

    // --- Eigene offene Gruppenanfragen ---------------------------------------
    const ownPendingPanels: DashboardPanelData[] = [];
    // Group docs may not be delivered yet right after registration/login.
    const loadedPendingGroups = (user.pendingGroups || []).filter((g) => g.exists());
    _.forEach(loadedPendingGroups, (group) => {
      ownPendingPanels.push({
        panelClass: "panel-green",
        fontAwesomeIcon: "fa-check",
        hugeContent: "Anfrage",
        smallContent: "für " + group.name,
        footerDescription: "Die Anfrage wird bearbeitet.",
        showLink: false,
        link: null,
      });
    });

    return {
      greeting: `Hallo ${userDAO.profile.first_name}, hier ist deine Übersicht`,
      trolleyPanels,
      coordinatorPanels,
      ownPendingPanels,
      isAdmin: user.isAdmin(),
    };
  });

  const adminPanel: DashboardPanelData = data.isAdmin
    ? {
        panelClass: "panel-green",
        fontAwesomeIcon: "fa-users",
        hugeContent: userCount,
        smallContent: "Benutzer",
        footerDescription: "Benutzerverwaltung.",
        showLink: true,
        link: Routes.path(Routes.Def.UserManagement),
      }
    : null;

  return (
    <div>
      <div className="row">
        <div className="col-lg-12">
          <h1 className="page-header" id="greeting">{data.greeting}</h1>
        </div>
      </div>
      <div className="row">
        {data.coordinatorPanels.map((p, i) => <DashboardPanel key={`coord-${i}`} {...p} />)}
        {data.ownPendingPanels.map((p, i) => <DashboardPanel key={`own-${i}`} {...p} />)}
        {data.trolleyPanels.map((p, i) => <DashboardPanel key={`trolley-${i}`} {...p} />)}
        {adminPanel ? <DashboardPanel key="admin" {...adminPanel} /> : null}
      </div>
    </div>
  );
}

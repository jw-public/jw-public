import * as React from "react";
import { useState } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { Link } from "react-router-dom";

import { GroupApplicationController } from "../../collections/lib/classes/Group";
import { GroupDAO, Groups } from "../../collections/lib/GroupCollection";
import User from "../../collections/lib/classes/User";
import { version } from "../../Version";

import { Def, buildPath, ParamNames } from "../../lib/RoutePaths";

// React replacement for the metisMenu-driven Blaze sidebar. The submenu
// markup keeps the sb-admin/metisMenu classes; open state lives in React.

function Submenu(props: {
  toggle: JSX.Element;
  id?: string;
  children: React.ReactNode;
}): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <li id={props.id} className={open ? "active" : undefined}>
      <a
        href="#"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          setOpen(!open);
        }}
      >
        {props.toggle}
        <span className="fa arrow"></span>
      </a>
      <ul
        className={`nav nav-second-level collapse${open ? " show" : ""}`}
        aria-expanded={open}
        style={{ display: open ? "block" : "none", height: "auto" }}
      >
        {props.children}
      </ul>
    </li>
  );
}

function GroupMenuEntry(props: { group: GroupDAO }): JSX.Element {
  const pendingUsersCount = useTracker(() => {
    const controller = new GroupApplicationController(props.group._id);
    controller.subscribeCount();
    return controller.applicationsCount;
  }, [props.group._id]);

  const groupParam = { [ParamNames.GroupId]: props.group._id };

  return (
    <Submenu
      toggle={
        <span>
          <i className="fa fa-square fa-fw"></i> Gruppe {props.group.name}{" "}
        </span>
      }
    >
      <li>
        <Link to={buildPath(Def.GroupMembers, groupParam)} className="auto-scroll">
          <i className="fa fa-users fa-fw"></i> Mitglieder
        </Link>
      </li>
      <li>
        <Link to={buildPath(Def.AssignmentManagement, groupParam)} className="auto-scroll">
          <i className="fa fa-list-ul fa-fw"></i> Einsätze verwalten
        </Link>
      </li>
      <li>
        <Link to={buildPath(Def.GroupApplicants, groupParam)} className="auto-scroll">
          <i className="fa fa-server fa-fw"></i> Offene Gruppenbewerbungen{" "}
          {pendingUsersCount > 0 ? (
            <div className="badge-danger float-end">{pendingUsersCount}</div>
          ) : null}
        </Link>
      </li>
      <li>
        <Link to={buildPath(Def.UserRegistration, groupParam)}>
          <i className="fa fa-link fa-fw"></i> Registrierungs-Link
        </Link>
      </li>
      <li>
        <Link to={buildPath(Def.CopyAssignments, groupParam)}>
          <i className="fa fa-clone fa-fw"></i> Einsätze wochenweise kopieren
        </Link>
      </li>
    </Submenu>
  );
}

export default function Sidebar(): JSX.Element {
  const data = useTracker(() => {
    Meteor.subscribe("ownUserData");
    Meteor.subscribe("coordinatingGroups");

    const userId = Meteor.userId();
    const user = new User(userId);

    return {
      isAdmin: user.exists() ? user.isAdmin() : false,
      isCoordinatorInAnyGroup: user.exists() ? user.isCoordinatorInAnyGroup(true) : false,
      coordinatingGroups: Groups.find(
        { coordinators: { $in: [userId] } },
        { sort: { name: 1 } },
      ).fetch(),
    };
  });

  return (
    <div className="navbar-default sidebar" role="navigation">
      <div className="sidebar-nav navbar-collapse collapse d-md-block">
        <ul className="nav" id="side-menu">
          {data.isAdmin ? (
            <li>
              <i className="fa fa-code-fork fa-fw"></i> Version {version.commit} #{version.build}
            </li>
          ) : null}

          <li>
            <Link to={buildPath(Def.Home)} className="auto-scroll" id="toDashboard">
              <i className="fa fa-dashboard fa-fw"></i> Übersicht
            </Link>
          </li>
          <li>
            <a href="https://docs.jw-public.org/userguide/" className="auto-scroll" id="toDocs">
              <i className="fa fa-book fa-fw"></i> Anleitung
            </a>
          </li>

          {data.isCoordinatorInAnyGroup ? (
            <li>
              <Link to={buildPath(Def.InfoSite)} className="auto-scroll">
                <i className="fa fa-question-circle fa-fw"></i> Info
              </Link>
            </li>
          ) : null}

          {data.isAdmin ? (
            <Submenu
              id="adminMenu"
              toggle={
                <span>
                  <i className="fa fa-wrench fa-fw"></i> Admin{" "}
                </span>
              }
            >
              <li>
                <Link to={buildPath(Def.UserManagement)} className="auto-scroll">
                  <i className="fa fa-users fa-fw"></i> Benutzerverwaltung
                </Link>
              </li>
              <li id="toGroupManagement">
                <Link to={buildPath(Def.GroupManagement)} className="auto-scroll">
                  <i className="fa fa-sitemap fa-fw"></i> Gruppenverwaltung
                </Link>
              </li>
            </Submenu>
          ) : null}

          {data.coordinatingGroups.map((group) => (
            <GroupMenuEntry key={group._id} group={group} />
          ))}
        </ul>
      </div>
    </div>
  );
}

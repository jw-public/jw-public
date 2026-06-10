import * as React from "react";
import { useState } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import * as _ from "underscore";
import * as moment from "moment";

import { AssignmentDAO, Assignments } from "../../../../collections/lib/AssignmentsCollection";
import Assignment from "../../../../collections/lib/classes/Assignment";
import { AssignmentState } from "../../../../collections/lib/classes/AssignmentState";
import User from "../../../../collections/lib/classes/User";

import * as AssignmentCancelModal from "../../components/assignmentCancelModal/AssignmentCancelModal";
import AssignmentFormComponent from "../../components/assignmentForm/AssignmentFormComponent";
import * as AssignmentManagerModal from "../../components/assignmentManager/AssignmentManagerModal";

import { Routes } from "../../../../lib/client/routes";

function BackButton(): JSX.Element {
  return (
    <button
      className="btn btn-primary"
      onClick={(e) => {
        e.preventDefault();
        window.history.back();
      }}
    >
      <i className="fa fa-chevron-left fa-fw"></i>
    </button>
  );
}

function UserEntryListElement(props: { user: User; hideCar?: boolean }): JSX.Element {
  const user = props.user;
  return (
    <li className="list-group-item"> {user.fullName}
      <span className="text-muted small hidden-xs">
        <em>{user.mobilePhone}</em>
      </span>
      <span className="pull-right">
        {!props.hideCar && user.carMostlyAvailable ? (
          <i className="fa fa-car" title={`${user.fullName} hat meistens ein Auto zur Verfügung`}></i>
        ) : null}{" "}
        <a href={`tel:${user.formattedMobilePhone}`} title={`${user.fullName} anrufen`} className="btn btn-xs btn-success toggle-application">
          <i className="fa fa-phone"></i>
        </a>{" "}
        <a href={`mailto:${user.email}`} title={`Eine E-Mail an ${user.fullName} senden`} className="btn btn-xs btn-primary toggle-application">
          <i className="fa fa-envelope"></i>
        </a>
      </span>
    </li>
  );
}

function AssignmentPreview(props: { assignmentDao: AssignmentDAO }): JSX.Element {
  const [collapsed, setCollapsed] = useState(true);
  const start = moment(props.assignmentDao.start).format("dddd LT");
  const end = moment(props.assignmentDao.end).format("LT");

  const participants = useTracker(
    () => Assignment.createFromDAO(props.assignmentDao).getParticipantsReactive(),
    [props.assignmentDao._id],
  );

  return (
    <div className="panel panel-primary">
      <div className="panel-heading" style={{ cursor: "pointer" }} onClick={() => setCollapsed(!collapsed)}>
        <h4 className="panel-title">
          <i className={`fa ${!collapsed ? "fa-chevron-circle-down" : "fa-chevron-circle-right"}`}></i> {`${start} - ${end}`}
        </h4>
      </div>
      <div
        id={props.assignmentDao._id}
        className={`panel-collapse collapse weekViewCollapse${collapsed ? "" : " in"}`}
        style={{ display: collapsed ? "none" : "block" }}
      >
        <ul className="list-group">
          {participants.map((u: User) => (
            <UserEntryListElement key={u.getId()} user={u} />
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function SingleAssignmentView(): JSX.Element {
  const data = useTracker(() => {
    const assignmentId = Routes.getParam(Routes.ParamNames.AssignmentId);
    const handle = Meteor.subscribe("singleAssignment", assignmentId);
    Meteor.subscribe("ownUserData");

    if (!handle.ready()) {
      return { ready: false } as any;
    }

    const assignmentDao = Assignments.findOne({ _id: assignmentId });
    if (!assignmentDao) {
      return { ready: false } as any;
    }

    const assignment = new Assignment(assignmentId);
    const isCoordinator = assignment.getGroup().isCoordinatorById(Meteor.userId());

    const infos: { label: string; value: string }[] = [];
    if (!_.isUndefined(assignmentDao.pickup_point)) {
      infos.push({ label: "Abholpunkt", value: assignmentDao.pickup_point });
    }
    if (!_.isUndefined(assignmentDao.return_point)) {
      infos.push({ label: "Rückgabepunkt", value: assignmentDao.return_point });
    }

    // Same-day assignments: same group/name, closed, with participants.
    const startOfDay = moment(assignmentDao.start).startOf("day");
    const endOfDay = startOfDay.clone().endOf("day");
    const sameDay = Assignments.find(
      {
        _id: { $not: assignmentDao._id } as any,
        group: assignmentDao.group,
        state: AssignmentState[AssignmentState.Closed],
        name: assignmentDao.name,
        start: { $gte: startOfDay.toDate(), $lt: endOfDay.toDate() },
        participants: { $exists: true, $not: { $size: 0 } } as any,
      },
      { sort: { start: 1, _id: 1 } },
    ).fetch();

    return {
      ready: true,
      assignmentId,
      assignmentDao,
      isCanceled: assignment.isCanceled(true),
      participants: assignment.getParticipantsReactive(),
      contacts: assignment.getContactsReactive(),
      replyEmailAddress: assignment.getGroup().getReplyEmailAddress(),
      groupId: assignment.getGroupId(),
      isCoordinator,
      infos,
      sameDay,
    };
  });

  if (!data.ready) {
    return <div />;
  }

  const dao: AssignmentDAO = data.assignmentDao;
  const fmt = (date: any, format: string) => moment(date).format(format);

  const onManage = (e: React.MouseEvent) => {
    e.preventDefault();
    AssignmentManagerModal.dialog({ assignmentId: data.assignmentId });
  };
  const onCancelAssignment = (e: React.MouseEvent) => {
    e.preventDefault();
    AssignmentCancelModal.cancelDialog(data.assignmentId);
  };
  const onReenable = (e: React.MouseEvent) => {
    e.preventDefault();
    AssignmentCancelModal.reenableDialog(data.assignmentId);
  };

  return (
    <div>
      <div className="row">
        <div className="col-lg-12">
          <h1 className="page-header"><BackButton /> {data.isCoordinator ? (
            <React.Fragment>
              <button type="button" className="btn btn-success manage-assignment" onClick={onManage}>
                <i className="fa fa-users"></i>
              </button>{" "}
              {!data.isCanceled ? (
                <button type="button" title="Termin absagen" className="btn btn-danger cancel-assignment" onClick={onCancelAssignment}>
                  <i className="fa fa-ban"></i>
                </button>
              ) : (
                <button type="button" title="Termin stattfinden lassen" className="btn btn-info reenable-assignment" onClick={onReenable}>
                  <i className="fa fa-calendar-check-o"></i>
                </button>
              )}
            </React.Fragment>
          ) : null} {dao.name}
            <small> {fmt(dao.start, "Do MMMM LT")} </small>
          </h1>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-5 col-md-8">
          <div className="row">
            <div className="col-sm-12 col-md-6 col-lg-6">
              <div className="col-xs-12 bg-primary assignment-head-element">
                <div className="col-xs-5 text-center">
                  <div className="huge row icon"><i className="fa fa-calendar"></i></div>
                </div>
                <div className="col-xs-7 info text-center">{fmt(dao.start, "ddd")}
                  <br />{fmt(dao.start, "Do MMM")}</div>
              </div>
            </div>

            <div className="col-sm-12 col-md-6 col-lg-6">
              <div className="col-xs-12 bg-primary assignment-head-element">
                <div className="col-xs-5 text-center">
                  <div className="huge row icon"><i className="fa fa-clock-o"></i></div>
                </div>
                <div className="col-xs-7 info text-center">
                  {fmt(dao.start, "LT")}
                  <br /><i className="fa fa-clock-o fa-fw"></i>
                  <br />{fmt(dao.end, "LT")}
                </div>
              </div>
            </div>
          </div>

          {data.isCanceled ? (
            <div className="row">
              <div className="col-sm-12">
                <div className="col-sm-12 bg-danger assignment-head-element">
                  <div className="col-xs-5 text-center">
                    <div className="huge row icon"><i className="fa fa-ban"></i></div>
                  </div>
                  <div className="col-xs-7 info text-center">Termin wurde abgesagt: {(dao as any).cancelationReason}</div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="panel panel-default">
            <div className="panel-heading">
              <i className="fa fa-users fa-fw"></i> Teilnehmer
            </div>
            <ul className="list-group">
              {data.participants.map((u: User) => (
                <UserEntryListElement key={u.getId()} user={u} />
              ))}
            </ul>
          </div>

          <div className="panel panel-default">
            <div className="panel-heading">
              <i className="fa fa-users fa-fw"></i> Ansprechpersonen
            </div>
            <ul className="list-group">
              {data.contacts.map((u: User) => (
                <UserEntryListElement key={u.getId()} user={u} hideCar />
              ))}
            </ul>
          </div>

          {data.replyEmailAddress ? (
            <div className="panel panel-default">
              <div className="panel-heading">
                <i className="fa fa-users fa-fw"></i> Bericht senden
              </div>
              <div className="panel-body">
                Sende uns bitte den Bericht als E-Mail:{" "}
                <span className="pull-right">
                  <a href={`mailto:${data.replyEmailAddress}`} title={`Bericht an ${data.replyEmailAddress} senden`} className="btn btn-xs btn-primary toggle-application">
                    <i className="fa fa-envelope"></i>
                  </a>
                </span>
              </div>
            </div>
          ) : null}

          {!_.isEmpty(data.infos) ? (
            <div className="panel panel-default">
              <div className="panel-heading">
                <i className="fa fa-info fa-fw"></i> Informationen
              </div>
              <ul className="list-group">
                {data.infos.map((info: { label: string; value: string }) => (
                  <li key={info.label} className="list-group-item">{info.label}: {info.value}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {dao.note ? (
            <div className="panel panel-default">
              <div className="panel-heading">
                <i className="fa fa-quote-left"></i> Notiz
              </div>
              <div className="panel-body" style={{ whiteSpace: "pre-line" }}>
                {dao.note}
              </div>
            </div>
          ) : null}

          {data.sameDay.length > 0 ? (
            <React.Fragment>
              <h2>Termine am gleichen Tag</h2>
              <div className="panel-group" id="accordion">
                {data.sameDay.map((a: AssignmentDAO) => (
                  <AssignmentPreview key={a._id} assignmentDao={a} />
                ))}
              </div>
            </React.Fragment>
          ) : null}
        </div>

        {data.isCoordinator ? (
          <div className="col-lg-7 col-md-8">
            <AssignmentFormComponent
              key={data.assignmentId}
              formType="update"
              doc={dao}
              resetOnSuccess={false}
              submitButtonText="Änderung speichern"
              headingText="Einsatz ändern"
              currentGroupId={data.groupId}
              fontAwesomeLogo="fa-floppy-o"
              panelClass="panel-primary"
              buttonClass="btn-primary"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

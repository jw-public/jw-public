import * as React from "react";
import { useEffect, useState } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import Select from "react-select";
import * as _ from "underscore";

import Assignment from "../../../../collections/lib/classes/Assignment";
import User from "../../../../collections/lib/classes/User";
import * as ServerMethodsWrapper from "../../../../lib/classes/ServerMethodsWrapper";

export interface AssignmentManagerProps {
  assignmentId: string;
  onSuccess?: () => void;
  onCancel?: (event?: any) => void;
}

function UserEntry(props: {
  userId: string;
  variant: "applicant" | "participant";
  onToggle: () => void;
}): JSX.Element {
  const { user, count } = useTracker(() => {
    const u = User.createFromId(props.userId);
    return { user: u, count: u.getAssignmentsParticipatedCount(true) };
  }, [props.userId]);

  return (
    <li className="list-group-item"> {user.fullName}
      <span className="float-end">
        {user.carMostlyAvailable ? (
          <i className="fa fa-car" title={`${user.fullName} hat meistens ein Auto zur Verfügung`}></i>
        ) : null}{" "}
        {props.variant === "applicant" ? (
          <span className="badge text-bg-secondary" title={`${user.fullName} wohnt in ${user.placeName} (PLZ: ${user.zip}).`}>
            {user.placeName}
          </span>
        ) : null}{" "}
        <span className="badge text-bg-secondary" title={`${user.fullName} wurde bereits ${count}x angenommen.`}>
          {count}
        </span>{" "}
        {props.variant === "applicant" ? (
          <button className="btn btn-sm btn-success toggle-application" title="Bewerber als Teilnehmer vormerken." onClick={props.onToggle}>
            <i className="fa fa-chevron-right"></i>
          </button>
        ) : (
          <button className="btn btn-sm btn-danger toggle-application" onClick={props.onToggle}>
            <i className="fa fa-chevron-left"></i>
          </button>
        )}
      </span>
    </li>
  );
}

export default function AssignmentManager(props: AssignmentManagerProps): JSX.Element {
  const [applicants, setApplicants] = useState<string[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [initialised, setInitialised] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>(null);

  // Subscriptions in separate trackers: a conditional subscribe inside one
  // computation flaps between ready states and causes endless re-renders.
  const assignmentData = useTracker(() => {
    const handle = Meteor.subscribe("singleAssignment", props.assignmentId);
    const ready = handle.ready();
    return {
      ready,
      groupId: ready ? new Assignment(props.assignmentId).getGroupId() : null,
    };
  }, [props.assignmentId]);

  const groupMembersOptions = useTracker(() => {
    if (!assignmentData.groupId) {
      return [] as { label: string; value: string }[];
    }
    const membersHandle = Meteor.subscribe("groupMembers", assignmentData.groupId);
    if (!membersHandle.ready()) {
      return [] as { label: string; value: string }[];
    }
    return Meteor.users
      .find(
        { groups: { $in: [assignmentData.groupId] } },
        { fields: { "profile.first_name": 1, "profile.last_name": 1 }, sort: { "profile.last_name": 1 } },
      )
      .map((c: Meteor.User) => ({ label: new User(c._id).fullName, value: c._id }));
  }, [assignmentData.groupId]);

  const data = { ready: assignmentData.ready, groupMembersOptions };

  // Initialise the working lists from the assignment once data is there
  // (the old code re-filled ReactiveArrays when the subscription got ready).
  useEffect(() => {
    if (data.ready && !initialised) {
      const assignment = new Assignment(props.assignmentId);
      setApplicants(assignment.getApplicantIds());
      setParticipants(assignment.getParticipantIds());
      setInitialised(true);
    }
  }, [data.ready, initialised, props.assignmentId]);

  const presentUserIds = _.union(applicants, participants);
  const addableOptions = data.groupMembersOptions.filter((o) => !presentUserIds.includes(o.value));

  const toggle = (userId: string) => {
    if (applicants.includes(userId)) {
      setApplicants(applicants.filter((id) => id !== userId));
      setParticipants([...participants, userId]);
    } else if (participants.includes(userId)) {
      setParticipants(participants.filter((id) => id !== userId));
      setApplicants([...applicants, userId]);
    }
  };

  const addParticipant = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedUserId) {
      return;
    }
    setApplicants(applicants.filter((id) => id !== selectedUserId));
    if (!participants.includes(selectedUserId)) {
      setParticipants([...participants, selectedUserId]);
    }
    setSelectedUserId(null);
  };

  const closeAndSubmit = () => {
    const proxy = new ServerMethodsWrapper.AssignmentProxy(props.assignmentId);
    proxy.close(participants, (error: any) => {
      if (error) {
        console.error(error);
        alert(error);
      } else if (!_.isUndefined(props.onSuccess) && _.isFunction(props.onSuccess)) {
        props.onSuccess();
      }
    });
  };

  const onCloseClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (participants.length > 0) {
      const dialog = bootbox.dialog({
        title: "Abschließen bestätigen",
        message: "Der Termin wird geschlossen und den restlichen Bewerbern wird abgesagt.\nAktion durchführen?",
        backdrop: true,
        buttons: {
          yesButton: {
            label: "Ja",
            className: "btn-primary",
            callback: () => {
              dialog.modal("hide");
              closeAndSubmit();
            },
          },
          noButton: {
            label: "Nein",
            className: "btn-outline-secondary",
            callback: () => {
              dialog.modal("hide");
            },
          },
        },
      });
    } else {
      const dialog = bootbox.dialog({
        title: "Leeren Termin schließen",
        message: "Der Termin wird <b>ohne Teilnehmer</b> geschlossen. Allen Bewerbern wird abgesagt.",
        backdrop: true,
        buttons: {
          yesButton: {
            label: "Ohne Teilnehmer schließen",
            className: "btn-warning",
            callback: () => {
              dialog.modal("hide");
              closeAndSubmit();
            },
          },
          noButton: {
            label: "Abbrechen",
            className: "btn-outline-secondary",
            callback: () => {
              dialog.modal("hide");
            },
          },
        },
      });
    }
  };

  return (
    <div className="row">
      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <i className="fa fa-users fa-fw"></i> Bewerber
          </div>
          <ul className="list-group">
            {applicants.length > 0 ? (
              applicants.map((userId) => (
                <UserEntry key={userId} userId={userId} variant="applicant" onToggle={() => toggle(userId)} />
              ))
            ) : (
              <li className="list-group-item">Keine Bewerber vorhanden.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <i className="fa fa-users fa-fw"></i> Teilnehmer
          </div>
          <ul className="list-group">
            {participants.length > 0 ? (
              participants.map((userId) => (
                <UserEntry key={userId} userId={userId} variant="participant" onToggle={() => toggle(userId)} />
              ))
            ) : (
              <li className="list-group-item">Keine Teilnehmer vorhanden.</li>
            )}
            <li className="list-group-item">
              <form onSubmit={addParticipant}>
                <div className="input-group">
                  <div style={{ minWidth: "200px", width: "100%" }} id="userSelect2">
                    <Select
                      inputId="addParticipantSelect"
                      placeholder="Benutzer"
                      options={addableOptions}
                      value={addableOptions.find((o) => o.value === selectedUserId) ?? null}
                      onChange={(selected: any) => setSelectedUserId(selected ? selected.value : null)}
                    />
                  </div>
                  <span className="input-group-btn">
                    <button type="submit" className="btn btn-success"><i className="fa fa-user-plus fa-fw"></i></button>
                  </span>
                </div>
              </form>
            </li>
          </ul>
        </div>
      </div>

      <div className="col-md-12">
        <button
          className="btn btn-primary close-application"
          title={participants.length > 0 ? "Termin abschließen und Teilnehmer bestätigen" : "Bitte zuerst Teilnehmer auswählen"}
          onClick={onCloseClick}
        >
          <i className="fa fa-lock"></i> Termin abschließen
        </button>{" "}
        {props.onCancel ? (
          <button
            className="btn btn-outline-secondary cancel"
            onClick={(e) => {
              e.preventDefault();
              props.onCancel(e);
            }}
          >
            <i className="fa fa-times"></i> Abbrechen
          </button>
        ) : null}
      </div>
    </div>
  );
}

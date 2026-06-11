import * as React from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { Routes } from "../../../lib/client/routes";

import User from "../../../collections/lib/classes/User";
import { Groups } from "../../../collections/lib/GroupCollection";
import * as UserCollection from "../../../collections/lib/UserCollection";
import { alertDialog, confirmDialog } from "../../react/components/dialogs";
import * as ServerMethodsWrapper from "../../../lib/classes/ServerMethodsWrapper";

import DataTable, { DataTableColumn } from "../../react/components/DataTable";

function acceptUser(userId: string): void {
  const groupId = Routes.getParam("groupId");
  console.log("Adding User " + userId + " zur Gruppe " + groupId);

  const proxy = new ServerMethodsWrapper.GroupProxy(groupId);
  proxy.addUserToGroup(userId).catch((err: Meteor.Error) => {
    console.error("Fehler bei Annehmen:", err);
    void alertDialog(err.reason, "Fehler");
  });
}

function denyUser(userId: string): void {
  const groupId = Routes.getParam("groupId");
  const user = User.createFromId(userId);

  console.log("Denying User " + userId + " " + groupId);

  void confirmDialog({
    message: "Anfrage von " + user.fullName + " (" + user.email + ") ablehnen.",
  }).then((result) => {
    if (result) {
      const proxy = new ServerMethodsWrapper.GroupProxy(groupId);
      proxy.denyUser(userId).catch((err: Meteor.Error) => {
        console.error("Fehler bem Ablehnen:", err);
        void alertDialog(err.reason, "Fehler");
      });
    }
  });
}

const columns: DataTableColumn<UserCollection.UserDAO>[] = [
  {
    title: "Vorname",
    render: (u) => u.profile?.first_name,
    sortValue: (u) => u.profile?.first_name ?? "",
  },
  {
    title: "Nachname",
    render: (u) => u.profile?.last_name,
    sortValue: (u) => u.profile?.last_name ?? "",
  },
  { title: "Telefon", render: (u) => u.profile?.mobileNat },
  {
    title: "E-Mail",
    render: (u) => u.emails?.[0]?.address,
    sortValue: (u) => u.emails?.[0]?.address ?? "",
  },
  {
    title: "",
    render: (u) => (
      <span>
        <button
          type="button"
          className="btn btn-success accept-user"
          onClick={() => acceptUser(u._id)}
        >
          <i className="fa fa-check"></i>
        </button>{" "}
        <button
          type="button"
          title="Gruppenanfrage ablehnen"
          className="btn btn-danger deny-user"
          onClick={() => denyUser(u._id)}
        >
          <i className="fa fa-times"></i>
        </button>
      </span>
    ),
  },
];

function searchText(u: UserCollection.UserDAO): string {
  return [
    u.profile?.first_name,
    u.profile?.last_name,
    u.profile?.mobileNat,
    u.emails?.[0]?.address,
  ].join(" ");
}

export default function ManageApplicants(): JSX.Element {
  const { groupName, applicants } = useTracker(() => {
    const groupId = Routes.getParam("groupId");
    Meteor.subscribe("groupApplicants", groupId);

    return {
      groupName: Groups.findOne({ _id: groupId })?.name ?? "",
      applicants: UserCollection.users
        .find({ "profile.pendingGroups": { $in: [groupId] } }, { sort: { "profile.last_name": 1 } })
        .fetch(),
    };
  });

  return (
    <div>
      <div className="row">
        <div className="col-lg-12">
          <h1 className="page-header">
            Bewerbungen <small>{groupName}</small>
          </h1>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-8">
          <div className="card card-primary">
            <div className="card-header">
              <i className="fa fa-users fa-fw"></i> Übersicht
            </div>
            <div className="card-body table-responsive">
              <DataTable
                columns={columns}
                rows={applicants}
                rowKey={(u) => u._id}
                searchText={searchText}
                defaultSort={{ column: 0, direction: "asc" }}
                tableClassName="table table-responsive"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

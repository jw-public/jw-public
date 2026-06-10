import * as React from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { Routes } from "../../../lib/client/routes";

import { Groups } from "../../../collections/lib/GroupCollection";
import * as UserCollection from "../../../collections/lib/UserCollection";

import DataTable, { DataTableColumn } from "../../react/components/DataTable";

const columns: DataTableColumn<UserCollection.UserDAO>[] = [
  { title: "Vorname", render: (u) => u.profile?.first_name, sortValue: (u) => u.profile?.first_name ?? "" },
  { title: "Nachname", render: (u) => u.profile?.last_name, sortValue: (u) => u.profile?.last_name ?? "" },
  { title: "Telefon", render: (u) => u.profile?.mobileNat },
  { title: "E-Mail", render: (u) => u.emails?.[0]?.address, sortValue: (u) => u.emails?.[0]?.address ?? "" },
  { title: "PLZ", render: (u) => u.profile?.zip, sortValue: (u) => u.profile?.zip ?? "" },
];

function searchText(u: UserCollection.UserDAO): string {
  return [
    u.profile?.first_name,
    u.profile?.last_name,
    u.profile?.mobileNat,
    u.emails?.[0]?.address,
    u.profile?.zip,
  ].join(" ");
}

export default function GroupMembers(): JSX.Element {
  const { groupName, members } = useTracker(() => {
    const groupId = Routes.getParam("groupId");
    Meteor.subscribe("groupMembers", groupId);

    return {
      groupName: Groups.findOne({ _id: groupId })?.name ?? "",
      members: UserCollection.users
        .find({ groups: { $in: [groupId] } }, { sort: { "profile.last_name": 1 } })
        .fetch(),
    };
  });

  return (
    <div>
      <div className="row">
        <div className="col-lg-12">
          <h1 className="page-header">Mitglieder <small>{groupName}</small></h1>
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
                rows={members}
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

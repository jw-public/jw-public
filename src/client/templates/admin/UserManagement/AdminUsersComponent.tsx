import { confirmDialog } from "../../../react/components/dialogs";
import * as React from "react";
import { useState } from "react";
import { Meteor } from "meteor/meteor";
import { Roles } from "meteor/alanning:roles";
import { useTracker } from "meteor/react-meteor-data";
import { Groups } from "../../../../collections/lib/GroupCollection";
import * as UserCollection from "../../../../collections/lib/UserCollection";
import * as ServerMethodsWrapper from "../../../../lib/classes/ServerMethodsWrapper";

import DataTable, { DataTableColumn } from "../../../react/components/DataTable";
import MultiSelect, { SelectOption } from "../../../react/components/MultiSelect";
import { InlineAlert, InlineAlerts } from "../../../react/components/InlineAlerts";

const GENDER_OPTIONS = [
  { label: "Bruder", value: "Male" },
  { label: "Schwester", value: "Female" },
];

function EditUserPanel(props: {
  user: UserCollection.UserDAO;
  groupsOptions: SelectOption[];
  rolesOptions: SelectOption[];
  onClose: () => void;
}): JSX.Element {
  const profile: any = props.user.profile ?? {};
  const [firstName, setFirstName] = useState(profile.first_name ?? "");
  const [lastName, setLastName] = useState(profile.last_name ?? "");
  const [gender, setGender] = useState(profile.gender ?? "Male");
  const [mobile, setMobile] = useState(profile.mobile ?? "");
  const [placeName, setPlaceName] = useState(profile.placeName ?? "");
  const [zip, setZip] = useState(profile.zip ?? "");
  const [pendingGroups, setPendingGroups] = useState<string[]>(profile.pendingGroups ?? []);
  const [groups, setGroups] = useState<string[]>((props.user as any).groups ?? []);
  const [roles, setRoles] = useState<string[]>(Roles.getRolesForUser(props.user._id) as string[]);
  const [email, setEmail] = useState(props.user.emails?.[0]?.address ?? "");
  const [notificationAsEmail, setNotificationAsEmail] = useState(profile.notificationAsEmail ?? true);
  const [notice, setNotice] = useState((props.user as any).notice ?? "");
  const [alerts, setAlerts] = useState<InlineAlert[]>([]);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAlerts([]);

    UserCollection.users.update(props.user._id, {
      $set: {
        "profile.first_name": firstName,
        "profile.last_name": lastName,
        "profile.gender": gender,
        "profile.mobile": mobile,
        "profile.placeName": placeName,
        "profile.zip": zip,
        "profile.pendingGroups": pendingGroups,
        "profile.notificationAsEmail": notificationAsEmail,
        groups,
        "emails.0.address": email,
        notice,
      },
    }, {}, (err: any) => {
      if (err) {
        console.error("Was trying to update an user: ", err);
        setAlerts([{ message: "Speichern fehlgeschlagen: " + (err.reason ?? err.message), type: "danger" }]);
      } else {
        // Roles live in their own collection since alanning:roles v4.
        Meteor.call("adminSetUserRoles", props.user._id, roles, (rolesErr: any) => {
          if (rolesErr) {
            console.error("Was trying to set roles: ", rolesErr);
            setAlerts([{ message: "Rollen speichern fehlgeschlagen: " + (rolesErr.reason ?? rolesErr.message), type: "danger" }]);
          } else {
            props.onClose();
          }
        });
      }
    });
  };

  return (
    <div className="card card-primary edit-user-panel">
      <div className="card-header">
        <div className="row">
          <div className="col-10"><i className="fa fa-pencil-square-o fa-fw"></i> User bearbeiten</div>
          <div className="col-2">
            <a
              href="#"
              className="btn btn-outline-secondary btn-sm cancel-update float-end"
              onClick={(e) => {
                e.preventDefault();
                props.onClose();
              }}
            >
              <i className="fa fa-times"></i>
            </a>
          </div>
        </div>
      </div>
      <div className="card-body">
        <InlineAlerts alerts={alerts} />
        <form onSubmit={onSubmit}>
          <fieldset>
            <div className="form-group">
              <label>Vorname</label>
              <input type="text" name="profile.first_name" className="form-control" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Nachname</label>
              <input type="text" name="profile.last_name" className="form-control" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Anrede</label>
              <div>
                {GENDER_OPTIONS.map((o) => (
                  <label key={o.value} className="radio-inline">
                    <input type="radio" name="profile.gender" value={o.value} checked={gender === o.value} onChange={() => setGender(o.value)} /> {o.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Handynummer</label>
              <input type="text" name="profile.mobile" className="form-control" value={mobile} onChange={(e) => setMobile(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Wohnort</label>
              <input type="text" name="profile.placeName" className="form-control" value={placeName} onChange={(e) => setPlaceName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Postleitzahl</label>
              <input type="text" name="profile.zip" className="form-control" value={zip} onChange={(e) => setZip(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Ausstehende Gruppenbewerbungen</label>
              <MultiSelect options={props.groupsOptions} value={pendingGroups} onChange={setPendingGroups} />
            </div>
            <div className="form-group">
              <label>Gruppen</label>
              <MultiSelect options={props.groupsOptions} value={groups} onChange={setGroups} />
            </div>
            <div className="form-group">
              <label>Rollen</label>
              <MultiSelect options={props.rolesOptions} value={roles} onChange={setRoles} />
            </div>
            <div className="form-group">
              <label>E-Mail</label>
              <input type="text" name="emails.0.address" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Benachrichtigungen via E-Mail bekommen</label>
              <div>
                <label className="radio-inline">
                  <input type="radio" name="profile.notificationAsEmail" checked={notificationAsEmail} onChange={() => setNotificationAsEmail(true)} /> Ja
                </label>
                <label className="radio-inline">
                  <input type="radio" name="profile.notificationAsEmail" checked={!notificationAsEmail} onChange={() => setNotificationAsEmail(false)} /> Nein
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>Notiz</label>
              <input type="text" name="notice" className="form-control" value={notice} onChange={(e) => setNotice(e.target.value)} />
            </div>
            <div className="form-group">
              <button type="submit" className="btn btn-primary submit-change"><i className="fa fa-floppy-o"></i>Speichern</button>{" "}
              <button type="button" className="btn btn-outline-secondary cancel-update" onClick={props.onClose}><i className="fa fa-times"></i>Abbruch</button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}

function removeUser(userId: string): void {
  confirmDialog({ message: "Den User wirklich löschen?" }).then((result) => {
      if (!result) {
        return;
      }
      const proxy = new ServerMethodsWrapper.AdminUserProxy(userId);
      proxy.removeUser((error: any) => {
        if (error) {
          console.error("Was trying to remove an user: ", error);
          alert("Fehler: " + error.toString());
        }
      });
  });
}

export default function AdminUsers(): JSX.Element {
  const [selectedUserId, setSelectedUserId] = useState<string>(null);

  const data = useTracker(() => {
    Meteor.subscribe("adminAllUsers");
    Meteor.subscribe("coordinatingGroups");
    Meteor.subscribe("roles");

    return {
      users: Meteor.users.find({}, { sort: { "profile.last_name": 1 } }).fetch() as UserCollection.UserDAO[],
      groupsOptions: Groups.find({}, {}).map((c) => ({ label: c.name, value: c._id })),
      rolesOptions: Meteor.roles.find({}, {}).map((c: any) => ({ label: c.name, value: c.name })),
    };
  });

  const selectedUser = selectedUserId
    ? (data.users.find((u) => u._id === selectedUserId) ?? null)
    : null;

  const columns: DataTableColumn<UserCollection.UserDAO>[] = [
    { title: "Vorname", render: (u) => u.profile?.first_name, sortValue: (u) => u.profile?.first_name ?? "" },
    { title: "Nachname", render: (u) => u.profile?.last_name, sortValue: (u) => u.profile?.last_name ?? "" },
    { title: "Telefon", render: (u) => u.profile?.mobileNat },
    { title: "E-Mail", render: (u) => u.emails?.[0]?.address, sortValue: (u) => u.emails?.[0]?.address ?? "" },
    { title: "PLZ", render: (u) => u.profile?.zip, sortValue: (u) => u.profile?.zip ?? "" },
    {
      title: "",
      render: (u) => (
        <span>
          <button type="button" className="btn btn-sm btn-trash remove-user" onClick={() => removeUser(u._id)}>
            <i className="fa fa-trash"></i>
          </button>{" "}
          <button type="button" className="btn btn-primary edit-user" onClick={() => setSelectedUserId(u._id)}>
            <i className="fa fa-pencil"></i>
          </button>
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="row">
        <div className="col-lg-12">
          <h1 className="page-header">Benutzerverwaltung</h1>
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
                rows={data.users}
                rowKey={(u) => u._id}
                searchText={(u) =>
                  [u.profile?.first_name, u.profile?.last_name, u.profile?.mobileNat, u.emails?.[0]?.address, u.profile?.zip].join(" ")
                }
                defaultSort={{ column: 0, direction: "asc" }}
                tableClassName="table table-responsive"
              />
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          {selectedUser ? (
            <EditUserPanel
              key={selectedUser._id}
              user={selectedUser}
              groupsOptions={data.groupsOptions}
              rolesOptions={data.rolesOptions}
              onClose={() => setSelectedUserId(null)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

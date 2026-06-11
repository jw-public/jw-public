import * as React from "react";
import { useState } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { Routes } from "../../../../lib/client/routes";

import { GroupApplicationController } from "../../../../collections/lib/classes/Group";
import { GroupDAO, Groups } from "../../../../collections/lib/GroupCollection";

import DataTable, { DataTableColumn } from "../../../react/components/DataTable";
import { InlineAlert, InlineAlerts } from "../../../react/components/InlineAlerts";
import MultiSelect, { SelectOption } from "../../../react/components/MultiSelect";

interface GroupFormValues {
  name: string;
  additional: string;
  email: string;
  coordinators: string[];
}

function GroupForm(props: {
  idPrefix: string;
  initial: GroupFormValues;
  userOptions: SelectOption[];
  submitLabel: JSX.Element;
  extraButtons?: JSX.Element;
  onSubmit: (
    values: GroupFormValues,
    onError: (message: string) => void,
    onSuccess: () => void,
  ) => void;
}): JSX.Element {
  const [name, setName] = useState(props.initial.name);
  const [additional, setAdditional] = useState(props.initial.additional);
  const [email, setEmail] = useState(props.initial.email);
  const [coordinators, setCoordinators] = useState<string[]>(props.initial.coordinators);
  const [alerts, setAlerts] = useState<InlineAlert[]>([]);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAlerts([]);
    props.onSubmit(
      { name, additional, email, coordinators },
      (message) => setAlerts([{ message, type: "danger" }]),
      () => {
        setName("");
        setAdditional("");
        setEmail("");
        setCoordinators([]);
      },
    );
  };

  return (
    <form onSubmit={onSubmit}>
      <fieldset>
        <InlineAlerts alerts={alerts} />
        <div className="form-group">
          <label className="form-label">Name</label>
          <input
            id={`${props.idPrefix}GroupName`}
            name="name"
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Zusätzliche Informationen</label>
          <textarea
            name="additional"
            rows={6}
            className="form-control"
            value={additional}
            onChange={(e) => setAdditional(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">E-Mail</label>
          <input
            name="email"
            type="text"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Koordinatoren</label>
          <MultiSelect
            inputId={`${props.idPrefix}Coordinators`}
            options={props.userOptions}
            value={coordinators}
            onChange={setCoordinators}
          />
        </div>
      </fieldset>
      {props.submitLabel}
      {props.extraButtons}
    </form>
  );
}

function GroupApplicationsCount(props: { groupId: string }): JSX.Element {
  const count = useTracker(() => {
    const controller = new GroupApplicationController(props.groupId);
    controller.subscribeCount();
    return controller.applicationsCount;
  }, [props.groupId]);

  return <span>{count}</span>;
}

export default function ModifyGroups(): JSX.Element {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const data = useTracker(() => {
    Meteor.subscribe("coordinatingGroups");
    Meteor.subscribe("adminAllUsers");

    return {
      groups: Groups.find({}, { sort: { name: 1 } }).fetch(),
      userOptions: Meteor.users.find({}, {}).map((c: any) => ({
        label: c.profile.first_name + " " + c.profile.last_name,
        value: c._id,
      })),
    };
  });

  const selectedGroup: GroupDAO | null = selectedGroupId
    ? (data.groups.find((g) => g._id === selectedGroupId) ?? null)
    : null;

  const columns: DataTableColumn<any>[] = [
    { title: "Name", render: (g) => g.name, sortValue: (g) => g.name ?? "" },
    {
      title: "Mitglieder",
      render: (g) => Meteor.users.find({ groups: { $in: [g._id] } }).count(),
    },
    {
      title: "Bewerbungen",
      render: (g) => <GroupApplicationsCount groupId={g._id} />,
    },
    {
      title: "",
      render: (g) => (
        <span>
          <a
            href={Routes.path(Routes.Def.UserRegistration, { groupId: g._id })}
            className="btn btn-primary"
          >
            <i className="fa fa-link"></i>
          </a>{" "}
          <button
            type="button"
            className="btn btn-primary edit-group"
            onClick={() => setSelectedGroupId(g._id)}
          >
            <i className="fa fa-pencil"></i>
          </button>
        </span>
      ),
    },
  ];

  const insertGroup = (
    values: GroupFormValues,
    onError: (m: string) => void,
    onSuccess: () => void,
  ) => {
    Groups.insert(
      {
        name: values.name,
        additional: values.additional,
        email: values.email,
        coordinators: values.coordinators,
      } as any,
      (err: any) => {
        if (err) {
          onError("Speichern fehlgeschlagen: " + (err.reason ?? err.message));
        } else {
          onSuccess();
        }
      },
    );
  };

  const updateGroup = (values: GroupFormValues, onError: (m: string) => void) => {
    Groups.update(
      selectedGroupId!,
      {
        $set: {
          name: values.name,
          additional: values.additional,
          email: values.email,
          coordinators: values.coordinators,
        },
      },
      {},
      (err: any) => {
        if (err) {
          onError("Speichern fehlgeschlagen: " + (err.reason ?? err.message));
        } else {
          setSelectedGroupId(null);
        }
      },
    );
  };

  return (
    <div>
      <div className="row">
        <div className="col-lg-12">
          <h1 className="page-header">Gruppenverwaltung</h1>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-8">
          <div className="card card-primary">
            <div className="card-header">
              <i className="fa fa-table fa-fw"></i> Übersicht
            </div>
            <div className="card-body table-responsive">
              <DataTable
                columns={columns}
                rows={data.groups}
                rowKey={(g) => g._id!}
                searchText={(g) => g.name ?? ""}
                defaultSort={{ column: 0, direction: "asc" }}
                tableClassName="table table-responsive"
              />
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          {!selectedGroup ? (
            <div className="card card-primary insert-panel">
              <div className="card-header">
                <i className="fa fa-plus-square fa-fw"></i> Gruppe hinzufügen
              </div>
              <div className="card-body">
                <GroupForm
                  idPrefix="input"
                  initial={{ name: "", additional: "", email: "", coordinators: [] }}
                  userOptions={data.userOptions}
                  submitLabel={
                    <button type="submit" id="saveButton" className="btn btn-primary">
                      <i className="fa fa-floppy-o"></i> Speichern
                    </button>
                  }
                  onSubmit={insertGroup}
                />
              </div>
            </div>
          ) : (
            <div className="card card-primary update-panel">
              <div className="card-header">
                <div className="row">
                  <div className="col-10">
                    <i className="fa fa-pencil-square-o fa-fw"></i> Gruppe bearbeiten
                  </div>
                  <div className="col-2">
                    <a
                      href="#"
                      className="btn btn-outline-secondary btn-sm cancel-update float-end"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedGroupId(null);
                      }}
                    >
                      <i className="fa fa-times"></i>
                    </a>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <GroupForm
                  key={selectedGroup._id}
                  idPrefix="update"
                  initial={{
                    name: selectedGroup.name ?? "",
                    additional: selectedGroup.additional ?? "",
                    email: (selectedGroup as any).email ?? "",
                    coordinators: selectedGroup.coordinators ?? [],
                  }}
                  userOptions={data.userOptions}
                  submitLabel={
                    <button type="submit" id="updateSaveButton" className="btn btn-primary">
                      <i className="fa fa-floppy-o"></i> Speichern
                    </button>
                  }
                  extraButtons={
                    <button
                      type="button"
                      className="btn btn-outline-secondary cancel-update"
                      onClick={() => setSelectedGroupId(null)}
                    >
                      <i className="fa fa-times"></i> Abbruch
                    </button>
                  }
                  onSubmit={updateGroup}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

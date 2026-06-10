import { confirmDialog } from "../../react/components/dialogs";
import * as React from "react";
import { useState } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import moment from "moment";
import { Routes } from "../../../lib/client/routes";

import DatePicker from "react-datepicker";

import { AssignmentDAO, Assignments } from "../../../collections/lib/AssignmentsCollection";
import { AssignmentState } from "../../../collections/lib/classes/AssignmentState";
import { Groups } from "../../../collections/lib/GroupCollection";
import * as ServerMethodsWrapper from "../../../lib/classes/ServerMethodsWrapper";

import DataTable, { DataTableColumn } from "../../react/components/DataTable";
import AssignmentFormComponent, { AssignmentFormProps } from "../components/assignmentForm/AssignmentFormComponent";
import AssignmentManagerComponent from "../components/assignmentManager/AssignmentManagerComponent";
import * as AssignmentManagerModal from "../components/assignmentManager/AssignmentManagerModal";

function removeAssignment(assignmentId: string): void {
  confirmDialog({ message: "Den Termin wirklich löschen?" }).then((result) => {
      if (!result) {
        return;
      }
      const proxy = new ServerMethodsWrapper.AssignmentProxy(assignmentId);
      proxy.remove((error: any) => {
        if (error) {
          console.error("Was trying to remove an assignment: ", error);
          alert("Fehler: " + error.toString());
        }
      });
  });
}

export default function ManageAssignments(): JSX.Element {
  const groupId = useTracker(() => Routes.getParam("groupId"));

  const [filterStart, setFilterStart] = useState<Date>(moment().subtract(1, "weeks").toDate());
  const [filterEnd, setFilterEnd] = useState<Date>(moment().add(4, "months").toDate());
  const [selectedId, setSelectedId] = useState<string>(null);
  const [copiedId, setCopiedId] = useState<string>(null);

  const data = useTracker(() => {
    Meteor.subscribe("assignmentsForGroupTable", groupId, filterStart, filterEnd);

    return {
      groupName: Groups.findOne({ _id: groupId })?.name ?? "",
      assignments: Assignments.find(
        {
          group: groupId,
          start: { $gte: filterStart },
          end: { $lte: filterEnd },
        },
        { sort: { start: -1 } },
      ).fetch(),
    };
  }, [groupId, filterStart, filterEnd]);

  const selectedAssignment = selectedId ? Assignments.findOne({ _id: selectedId }) : null;
  const copiedAssignment = copiedId ? Assignments.findOne({ _id: copiedId }) : null;

  const toggleEdit = (assignment: AssignmentDAO) => {
    if (selectedId === assignment._id) {
      setSelectedId(null);
    } else {
      setCopiedId(null);
      setSelectedId(assignment._id);
    }
  };

  const toggleCopy = (assignment: AssignmentDAO) => {
    if (copiedId === assignment._id) {
      setCopiedId(null);
    } else {
      setSelectedId(null);
      setCopiedId(assignment._id);
    }
  };

  const columns: DataTableColumn<AssignmentDAO>[] = [
    { title: "Name", render: (a) => a.name, sortValue: (a) => a.name ?? "" },
    {
      title: "Termin",
      render: (a) => (a.start instanceof Date ? moment(a.start).format("L LT") : ""),
      sortValue: (a) => a.start as any,
    },
    { title: "Bew.", render: (a) => a.applicants?.length ?? 0 },
    { title: "Teiln.", render: (a) => a.participants?.length ?? 0 },
    { title: "Zustand", render: (a) => (a.state === "Hidden" ? "Versteckt" : a.state) },
    {
      title: "",
      render: (a) => {
        const isClosed = a.state === AssignmentState[AssignmentState.Closed];
        return (
          <div className="btn-group">
            <button type="button" className="btn btn-sm btn-trash remove-assignment" title="Termin löschen" onClick={() => removeAssignment(a._id)}>
              <i className="fa fa-fw fa-trash"></i>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${isClosed ? "btn-warning" : "btn-danger"} manage-assignment`}
              title={isClosed ? "Termin erneut abschließen" : "Termin abschließen"}
              onClick={() => AssignmentManagerModal.dialog({ assignmentId: a._id, onSuccess: () => {} })}
            >
              <i className={`fa fa-fw ${isClosed ? "fa-lock" : "fa-unlock"}`}></i>
            </button>
            <button type="button" className="btn btn-sm btn-primary edit-assignment" title="Daten bearbeiten" onClick={() => toggleEdit(a)}>
              <i className="fa fa-fw fa-pencil"></i>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${copiedId === a._id ? "btn-info" : "btn-outline-secondary"} copy-assignment`}
              title="Als Kopiervorlage verwenden"
              onClick={() => toggleCopy(a)}
            >
              <i className="fa fa-fw fa-clone"></i>
            </button>
          </div>
        );
      },
    },
  ];

  let formProps: AssignmentFormProps;
  let formKey: string;
  if (selectedAssignment) {
    formProps = {
      formType: "update",
      doc: selectedAssignment,
      resetOnSuccess: false,
      submitButtonText: "Änderung speichern",
      fontAwesomeLogo: "fa-floppy-o",
      headingText: "Daten ändern",
      currentGroupId: groupId,
      panelClass: "card-danger",
      buttonClass: "btn-danger",
    };
    formKey = `update-${selectedAssignment._id}`;
  } else if (copiedAssignment) {
    formProps = {
      formType: "insert",
      doc: copiedAssignment,
      resetOnSuccess: false,
      submitButtonText: "Kopieren",
      fontAwesomeLogo: "fa-clone",
      headingText: "Einsatz kopieren",
      currentGroupId: groupId,
      panelClass: "card-info",
      buttonClass: "btn-primary",
    };
    formKey = `copy-${copiedAssignment._id}`;
  } else {
    formProps = {
      formType: "insert",
      doc: null,
      resetOnSuccess: true,
      submitButtonText: "Erstellen",
      fontAwesomeLogo: "fa-plus",
      headingText: "Einsatz hinzufügen",
      currentGroupId: groupId,
      panelClass: "card-primary",
      buttonClass: "btn-primary",
    };
    formKey = "insert";
  }

  return (
    <div>
      <div className="row">
        <div className="col-lg-12">
          <h1 className="page-header">Einsätze <small>{data.groupName}</small></h1>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-7">
          <div className="card card-primary">
            <div className="card-header">
              <i className="fa fa-table"></i> Übersicht
            </div>
            <div className="card-body table-responsive">
              <div className="row">
                <div className="col-lg-8 col-md-10">
                  <div className="form-inline">
                    <div className="form-group">
                      <label>Von:{" "}</label>{" "}
                      <DatePicker
                        selected={filterStart}
                        onChange={(date: Date) => date && setFilterStart(date)}
                        dateFormat="dd.MM.yyyy"
                        locale="de"
                        className="form-control input-sm"
                      />
                    </div>{" "}
                    <div className="form-group">
                      <label>Bis:{" "}</label>{" "}
                      <DatePicker
                        selected={filterEnd}
                        onChange={(date: Date) => date && setFilterEnd(date)}
                        dateFormat="dd.MM.yyyy"
                        locale="de"
                        className="form-control input-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="row" style={{ marginTop: "15px" }}>
                <div className="col-lg-12">
                  <DataTable
                    columns={columns}
                    rows={data.assignments}
                    rowKey={(a) => a._id}
                    searchText={(a) => `${a.name} ${a.state} ${moment(a.start).format("L LT")}`}
                    defaultSort={{ column: 1, direction: "desc" }}
                    tableClassName="table table-responsive"
                    rowClassName={(a) => (a._id === selectedId ? "active" : undefined)}
                  />
                </div>
              </div>
            </div>
          </div>

          {selectedAssignment ? (
            <div className="well">
              <AssignmentManagerComponent
                key={selectedAssignment._id}
                assignmentId={selectedAssignment._id}
                onSuccess={() => setSelectedId(null)}
              />
            </div>
          ) : null}
        </div>

        <div className="col-lg-5">
          <AssignmentFormComponent key={formKey} {...formProps} />
        </div>
      </div>
    </div>
  );
}

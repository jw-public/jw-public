import { Session } from "meteor/session";
import * as moment from 'moment';
import * as AssignmentForm from "./AssignmentForm";

import { ReactiveVar } from "meteor/reactive-var";
import { AssignmentDAO, Assignments } from "../../collections/lib/AssignmentsCollection";
import { ReactiveVarWrapper } from '../common/ReactiveVarWrapper';

const ASSIGNMENT_SELECTION_NAME = "assignmentOptions_selected_assignment";
const ASSIGNMENT_COPY_NAME = "assignmentOptions_copy_assignment";

let initalisedSelection = {};
let initalisedClipboard = {};

function initSelection(groupId: string) {
  Session.setDefault(groupId + ASSIGNMENT_SELECTION_NAME, null);
  initalisedSelection[groupId] = true;
}

function initClipboard(groupId: string) {
  Session.setDefault(groupId + ASSIGNMENT_COPY_NAME, null);
  initalisedClipboard[groupId] = true;
}

export function getSelectedAssignmentId(groupId: string): string {
  if (!initalisedSelection[groupId]) {
    initSelection(groupId);
  }

  return Session.get(groupId + ASSIGNMENT_SELECTION_NAME);
}

export function getCopiedAssignmentId(groupId: string): string {
  if (!initalisedClipboard[groupId]) {
    initClipboard(groupId);
  }

  return Session.get(groupId + ASSIGNMENT_COPY_NAME);
}

export function setCopiedAssignmentId(groupId: string, id: string): void {
  Session.set(groupId + ASSIGNMENT_COPY_NAME, id);
}

export function resetClipboard(groupId: string): void {
  setCopiedAssignmentId(groupId, null);
}


export function getCopiedAssignment(groupId: string): AssignmentDAO {
  var id: string = getCopiedAssignmentId(groupId);
  if (!id || id == null) { // Falls nichts kopiert ist.
    return null;
  } else {
    return Assignments.findOne({ _id: id });
  }
}

export function setSelectedAssignmentId(groupId: string, id: string): void {
  Session.set(groupId + ASSIGNMENT_SELECTION_NAME, id);
}

export function resetSelection(groupId: string) {
  setSelectedAssignmentId(groupId, null);
  AssignmentForm.resetDurationToDefault();
}

export function getSelectedAssignment(groupId: string): AssignmentDAO {
  var id: string = getSelectedAssignmentId(groupId);
  if (!id || id == null) { // Falls nicht selektiert ist.
    return null;
  } else {
    return Assignments.findOne({ _id: id });
  }
}

export function isAssignmentSelected(groupId: string): boolean {
  var id: string = getSelectedAssignmentId(groupId);
  return id != null && Assignments.find({ _id: id }, { fields: { "_id": 1 } }).count() > 0;
}


export function isAssignmentInClipboard(groupId: string): boolean {
  var id: string = getCopiedAssignmentId(groupId);
  return id != null && Assignments.find({ _id: id }, { fields: { "_id": 1 } }).count() > 0;
}

export function filterStartDate(): ReactiveVar<Date> {
  return new ReactiveVarWrapper<Date>({
    nameOfSessionVar: "assignmentFilterStartDate",
    defaultValue: moment().subtract(1, "weeks").toDate()
  });
}

export function filterEndDate(): ReactiveVar<Date> {
  return new ReactiveVarWrapper<Date>({
    nameOfSessionVar: "assignmentFilterEndDate",
    defaultValue: moment().add(4, "months").toDate()
  });
}
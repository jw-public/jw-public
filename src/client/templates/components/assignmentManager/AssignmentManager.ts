import { Blaze } from "meteor/blaze";
import { Template } from "meteor/templating";
import * as _ from "underscore";

import Assignment from "../../../../collections/lib/classes/Assignment";

import * as ServerMethodsWrapper from "../../../../lib/classes/ServerMethodsWrapper";

const KEY_PARTICIPANTS = "_p";
const KEY_APPLICANTS = "_a";

export let AddParticipantSchema = new SimpleSchema({
  userId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  }
});

export interface TemplateOptions {
  assignmentId: string;
  onSuccess?: () => void;
  onCancel?: (event?: Event) => void;
}

export interface NestedTemplate {
  parentInstance: Blaze.TemplateInstance;
}

export interface UserItem extends NestedTemplate {
  userId: string;
  assignmentId: string;
}


export function init() {
  let context = Template.currentData() as TemplateOptions;
  let assignment = new Assignment(context.assignmentId);
  let instance = Template.instance();

  instance.subscribe("groupMembers", assignment.getGroupId());


  let applicantsArray = getApplicantsArray(instance);
  let participantsArray = getParticipantsArray(instance);

  // Alte Werte löschen
  applicantsArray.clear();
  participantsArray.clear();

  // Reaktive Arrays neu befüllen
  _.forEach(assignment.getApplicantIds(), function (applicantId) {
    applicantsArray.push(applicantId);
  });

  _.forEach(assignment.getParticipantIds(), function (participantId) {
    participantsArray.push(participantId);
  });
}

function isParticipantsArrayInitialised(templateInstance: Blaze.TemplateInstance): boolean {
  return !_.isUndefined(templateInstance[KEY_PARTICIPANTS]);
}

function initParticipantsArray(templateInstance: Blaze.TemplateInstance): void {
  templateInstance[KEY_PARTICIPANTS] = new ReactiveArray<string>();
}

export function getParticipantsArray(templateInstance: Blaze.TemplateInstance): ReactiveArray<string> {
  if (!isParticipantsArrayInitialised(templateInstance)) {
    initParticipantsArray(templateInstance);
  }

  return templateInstance[KEY_PARTICIPANTS];
}
function isApplicantsArrayInitialised(templateInstance: Blaze.TemplateInstance): boolean {
  return !_.isUndefined(templateInstance[KEY_APPLICANTS]);
}

function initApplicantsArray(templateInstance: Blaze.TemplateInstance): void {
  templateInstance[KEY_APPLICANTS] = new ReactiveArray<string>();
}

export function getApplicantsArray(templateInstance: Blaze.TemplateInstance): ReactiveArray<string> {
  if (!isApplicantsArrayInitialised(templateInstance)) {
    initApplicantsArray(templateInstance);
  }

  return templateInstance[KEY_APPLICANTS];
}

export function toggleParticipation(templateInstance: Blaze.TemplateInstance, userId: string) {
  let applicantsArray = getApplicantsArray(templateInstance);
  let participantsArray = getParticipantsArray(templateInstance);

  let indexInApplicants: number = applicantsArray.indexOf(userId);
  let indexInParticipants: number = participantsArray.indexOf(userId);

  let isApplicant: boolean = indexInApplicants >= 0;
  let isParticipant: boolean = indexInParticipants >= 0;

  if (isApplicant && !isParticipant) {
    applicantsArray.splice(indexInApplicants, 1);
    participantsArray.push(userId);
  } else if (!isApplicant && isParticipant) {
    participantsArray.splice(indexInParticipants, 1);
    applicantsArray.push(userId);
  }

}

export function addParticipant(templateInstance: Blaze.TemplateInstance, userId: string) {
  let applicantsArray = getApplicantsArray(templateInstance);
  let participantsArray = getParticipantsArray(templateInstance);

  let indexInApplicants: number = applicantsArray.indexOf(userId);
  let indexInParticipants: number = participantsArray.indexOf(userId);

  let isApplicant: boolean = indexInApplicants >= 0;
  let isParticipant: boolean = indexInParticipants >= 0;

  if (isApplicant) {
    applicantsArray.splice(indexInApplicants, 1);
  }
  if (!isParticipant) {
    participantsArray.push(userId);
  }
}


export function getPresentUserIds(templateInstance: Blaze.TemplateInstance): Array<string> {
  let applicantIds = getApplicantsArray(templateInstance).list().array();
  let participantIds = getParticipantsArray(templateInstance).list().array();

  let allIds = _.union(applicantIds, participantIds);
  return allIds;
}

export function toggleEventFunction(event: Event) {
  event.preventDefault();
  let context = Template.currentData() as UserItem;
  toggleParticipation(context.parentInstance, context.userId);
}

export function closeAndSubmitAssignment(templateInstance: Blaze.TemplateInstance, assignmentId: string): void {
  let assignmentProxy = new ServerMethodsWrapper.AssignmentProxy(assignmentId);

  let participantsArray = getParticipantsArray(templateInstance).array();

  assignmentProxy.close(participantsArray, function (error) {
    if (error) {
      console.error(error);
      alert(error);
    } else {
      let context = templateInstance.data as TemplateOptions;

      if (!_.isUndefined(context.onSuccess) && _.isFunction(context.onSuccess)) {
        context.onSuccess();
      }

    }
  });

}

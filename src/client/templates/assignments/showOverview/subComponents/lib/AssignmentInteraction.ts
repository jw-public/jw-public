import { confirmDialog } from "../../../../../react/components/dialogs";
import * as _ from "underscore";

import { Meteor } from "meteor/meteor";
import { Session } from "meteor/session";

import { AssignmentDAO } from "../../../../../../collections/lib/AssignmentsCollection";

import * as ServerMethodsWrapper from "../../../../../../lib/classes/ServerMethodsWrapper";
import { Routes } from "../../../../../../lib/client/routes";

export default class AssignmentInteraction {
  private proxy: ServerMethodsWrapper.AssignmentProxy = null;

  private sessionKeyForVariable: string;
  private assignmentId: string;

  constructor(private assignment: AssignmentDAO) {
    this.assignmentId = assignment._id;
    this.proxy = new ServerMethodsWrapper.AssignmentProxy(this.assignmentId);
    this.sessionKeyForVariable = `pending_request_for_${this.assignmentId}`;
  }

  public cancelApplication() {
    this.requestPending = true;

    this.proxy.cancelApplication((err: Meteor.Error) => {
      this.requestPending = false;
      this.handleError(err);
    });
  }

  public apply() {
    this.requestPending = true;

    this.proxy.applyOnAssignment((err: Meteor.Error) => {
      this.requestPending = false;
      this.handleError(err);
    });
  }

  private isMobileScreen(): boolean {
    // Bootstrap md breakpoint (the old ResponsiveHelper probed BS3 hidden-*
    // classes, which no longer exist in Bootstrap 5).
    return window.matchMedia("(max-width: 991px)").matches;
  }

  public applyWithConfirmation() {
    if (this.isMobileScreen()) {
      this.confirmAndApplyOnYes();
    } else {
      this.apply();
    }
  }

  private confirmAndApplyOnYes() {
    confirmDialog({ message: "Auf Termin " + this.assignment.name + " bewerben?" }).then(
      (userPressedOnYes) => {
        if (userPressedOnYes) {
          this.apply();
        }
      },
    );
  }

  private handleError(error: Meteor.Error) {
    if (!_.isUndefined(error)) {
      alert(error.reason);
      console.error(error);
    }
  }

  public set requestPending(value: boolean) {
    Session.set(this.sessionKeyForVariable, value);
  }

  public get requestPending(): boolean {
    Session.setDefault(this.sessionKeyForVariable, false);

    return Session.get(this.sessionKeyForVariable);
  }

  public goToAssignment(): void {
    Routes.go(Routes.Def.AssignmentSingleView, { assignmentId: this.assignmentId });
  }
}

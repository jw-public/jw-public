import * as _ from "underscore";

import {Meteor} from "meteor/meteor";
import {Session} from "meteor/session";

import {Assignments, AssignmentDAO} from "../../../../../../collections/lib/AssignmentsCollection";

import * as ServerMethodsWrapper from "../../../../../../lib/classes/ServerMethodsWrapper";
import * as ResponsiveHelper from "../../../../../lib/plugins/responsive-toolkit/ResponsiveHelper";
import {Routes} from "../../../../../../lib/client/routes";

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
    return ResponsiveHelper.isBootstrapEnvironment("xs") || ResponsiveHelper.isBootstrapEnvironment("sm");
  }

  public applyWithConfirmation() {
    if (this.isMobileScreen() ) {
      this.confirmAndApplyOnYes();
    } else {
      this.apply();
    }
  }

  private confirmAndApplyOnYes() {
    bootbox.confirm("Auf Termin " + this.assignment.name + " bewerben?", (userPressedOnYes: boolean) => {
      if (userPressedOnYes) {
        this.apply();
      }
    });
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
    Routes.go(Routes.Def.AssignmentSingleView, {assignmentId: this.assignmentId} );
  }

}

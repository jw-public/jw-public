import * as _ from "underscore";


import Assignment from "../../../../collections/lib/classes/Assignment";
import { AssignmentState } from "../../../../collections/lib/classes/AssignmentState";
import * as AssignmentForm from "../../components/assignmentForm/AssignmentForm";
import * as AssignmentManagerModal from "../../components/assignmentManager/AssignmentManagerModal";
import { Assignments, AssignmentDAO } from "../../../../collections/lib/AssignmentsCollection";

import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Session } from "meteor/session";
import { Mongo } from "meteor/mongo";
import { Blaze } from "meteor/blaze";
import { ReactiveVar } from "meteor/reactive-var";
import { subsCache } from "../../../lib/subscription-cache";

import * as AccordionTemplateStorage from "../../helperModules/AccordionTemplateStorage";
import * as AssignmentCancelModal from "../../components/assignmentCancelModal/AssignmentCancelModal";

import * as moment from "moment";


import { Routes } from "../../../../lib/client/routes";

import { Helper } from "../../../../lib/HelperDecorator";
import { TemplateDefinition } from "../../../../lib/TemplateDefinitionDecorator";
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';


namespace SingleAssignmentView {
  export function getAssignmentId(): string {
    return FlowRouter.getParam(Routes.ParamNames.AssignmentId);
  }

  export function getAssignmentDAO(): AssignmentDAO {
    return Assignments.findOne({ "_id": getAssignmentId() });
  }

  export interface AssignmentPreviewContext {
    assignmentDao: AssignmentDAO;
  }

  export function createHtmlId(context: SingleAssignmentView.AssignmentPreviewContext) {
    return context.assignmentDao._id;
  }

  export function assignmentsOnSameDay(): Mongo.Cursor<AssignmentDAO> {
    let assignmentDao = getAssignmentDAO();

    let startOfDay = moment(assignmentDao.start).startOf("day");
    let endOfDay = startOfDay.clone().endOf("day");

    return Assignments.find(
      /*
      *  Termine einer Gruppe, die am gleichen Tag stattfinden,
      *  müssen alle den gleichen Namen haben, geschlossen sein
      *  und mindestens einen Teilnehmer haben.
      */
      {
        "_id": { $not: assignmentDao._id },
        "group": assignmentDao.group,
        "state": AssignmentState[AssignmentState.Closed],
        "name": assignmentDao.name,
        "start": { "$gte": startOfDay.toDate(), "$lt": endOfDay.toDate() },
        "participants": { $exists: true, $not: { $size: 0 } }
      }, { sort: { start: 1, _id: 1 } });
  }
}

interface AssignmentInfo {
  label: string;
  value: string;
}


Template["singleAssignmentView"].created = function () {
  let instance = Template.instance();

  instance.autorun(function () {
    subsCache.subscribe("singleAssignment", SingleAssignmentView.getAssignmentId());
    subsCache.subscribe("ownUserData");
  });
};



@TemplateDefinition("singleAssignmentView")
class SingleAssignmentViewData {

  @Helper
  static assignment(): AssignmentDAO {
    return SingleAssignmentView.getAssignmentDAO();
  }


  static formatAssignmentStartDateAs(format: string): string {
    let startDate = SingleAssignmentViewData.assignment().start;
    return moment(startDate).format(format);
  }

  static formatAssignmentEndDateAs(format: string): string {
    let startDate = SingleAssignmentViewData.assignment().end;
    return moment(startDate).format(format);
  }

  @Helper
  static assignmentDateAndTime(): string {
    return SingleAssignmentViewData.formatAssignmentStartDateAs("Do MMMM LT");
  }

  @Helper
  static assignmentWeekday(): string {
    return SingleAssignmentViewData.formatAssignmentStartDateAs("ddd");
  }

  @Helper
  static assignmentDayAndMonth(): string {
    return SingleAssignmentViewData.formatAssignmentStartDateAs("Do MMM");
  }

  @Helper
  static assignmentStartTime(): string {
    return SingleAssignmentViewData.formatAssignmentStartDateAs("LT");
  }

  @Helper
  static assignmentEndTime(): string {
    return SingleAssignmentViewData.formatAssignmentEndDateAs("LT");
  }

  @Helper
  static assignmentObject(): Assignment {
    return new Assignment(SingleAssignmentView.getAssignmentId());
  }
  @Helper
  static isCoordinator(): boolean {
    let assignment = new Assignment(SingleAssignmentView.getAssignmentId());
    return assignment.getGroup().isCoordinatorById(Meteor.userId());
  }
  @Helper
  static replyEmailAddress(): string {
    let assignment = new Assignment(SingleAssignmentView.getAssignmentId());;
    let email = assignment.getGroup().getReplyEmailAddress();
    return email;
  }
  @Helper
  static assignmentFormOptions(): AssignmentForm.TemplateOptions {
    let assignment = new Assignment(SingleAssignmentView.getAssignmentId());

    if (!assignment.getGroup().isCoordinatorById(Meteor.userId())) {
      return null;
    }
    return {
      formType: "update",
      doc: Assignments.findOne({ "_id": assignment.getAssignmentId() }),
      resetOnSuccess: false,
      submitButtonText: "Änderung speichern",
      headingText: "Einsatz ändern",
      currentGroupId: assignment.getGroupId(),
      fontAwesomeLogo: "fa-floppy-o",
      panelClass: "panel-primary",
      buttonClass: "btn-primary"
    };
  }
  @Helper
  static assignmentInfos(): Array<AssignmentInfo> {
    let infos: Array<AssignmentInfo> = new Array();
    let assignmentDAO: AssignmentDAO = Assignments.findOne({ "_id": SingleAssignmentView.getAssignmentId() }, { reactive: true });

    if (_.isUndefined(assignmentDAO) || _.isNull(assignmentDAO)) {
      return [];
    }

    if (!_.isUndefined(assignmentDAO.pickup_point)) {
      infos.push({
        label: "Abholpunkt",
        value: assignmentDAO.pickup_point
      });
    }

    if (!_.isUndefined(assignmentDAO.return_point)) {
      infos.push({
        label: "Rückgabepunkt",
        value: assignmentDAO.return_point
      });
    }

    return infos;
  }



  @Helper
  static assignmentPreviewContexts(): Array<SingleAssignmentView.AssignmentPreviewContext> {
    let assignmentDao = SingleAssignmentView.getAssignmentDAO();

    let startOfDay = moment(assignmentDao.start).startOf("day");
    let endOfDay = startOfDay.clone().endOf("day");

    let cursor = SingleAssignmentView.assignmentsOnSameDay();

    return cursor.map<SingleAssignmentView.AssignmentPreviewContext>(function (assignmentDao: AssignmentDAO): SingleAssignmentView.AssignmentPreviewContext {
      return {
        assignmentDao: assignmentDao
      };
    });
  }

  @Helper
  static hasOtherAssignmentsOnSameDay(): boolean {
    let cursor = SingleAssignmentView.assignmentsOnSameDay();

    return cursor.count() > 0;
  }

  @Helper
  static formatDate(date: moment.Moment, format: string): string {
    return moment(date).format(format);
  }
}

@TemplateDefinition("assignmentPreview")
class AssignmentPreviewViewData {

  @Helper
  static assignment(): AssignmentDAO {
    return (<any>Template.instance().data).assignmentDao;
  }

  static formatAssignmentStartDateAs(format: string): string {
    let startDate = AssignmentPreviewViewData.assignment().start;
    return moment(startDate).format(format);
  }

  static formatAssignmentEndDateAs(format: string): string {
    let startDate = AssignmentPreviewViewData.assignment().end;
    return moment(startDate).format(format);
  }

  @Helper
  static timeOfAssignment(): string {
    let start = AssignmentPreviewViewData.formatAssignmentStartDateAs("dddd LT");
    let end = AssignmentPreviewViewData.formatAssignmentEndDateAs("LT");
    return `${start} - ${end}`;
  }

}


Template["singleAssignmentView"].events({
  "click .manage-assignment": function (e: Event, template: Blaze.TemplateInstance) {
    e.preventDefault();
    AssignmentManagerModal.dialog({
      assignmentId: SingleAssignmentView.getAssignmentId()
    });

  },
  "click .cancel-assignment": function (e: Event, template: Blaze.TemplateInstance) {
    e.preventDefault();

    AssignmentCancelModal.cancelDialog(SingleAssignmentView.getAssignmentId());

  },
  "click .reenable-assignment": function (e: Event, template: Blaze.TemplateInstance) {
    e.preventDefault();

    AssignmentCancelModal.reenableDialog(SingleAssignmentView.getAssignmentId());
  },

});


Template["assignmentPreview"].onRendered(function () {
  let instance = Template.instance();
  AccordionTemplateStorage.setCollapsed(instance, true);

  instance.autorun(function () {

    let context = <SingleAssignmentView.AssignmentPreviewContext>Template.currentData();


    $("#" + SingleAssignmentView.createHtmlId(context)).collapse({
      toggle: false,
      parent: "#accordion"
    }).on("hide.bs.collapse", function () {
      AccordionTemplateStorage.setCollapsed(instance, true);
    }).on("show.bs.collapse", function () {
      AccordionTemplateStorage.setCollapsed(instance, false);
    });
  });



});


Template["assignmentPreview"].helpers({
  htmlId: function (): string {
    let context = <SingleAssignmentView.AssignmentPreviewContext>Template.currentData();
    return SingleAssignmentView.createHtmlId(context);
  },
  collapsed: function (): boolean {
    let instance = Template.instance();

    return AccordionTemplateStorage.isCollapsed(instance);
  },
  assignment: function (): Assignment {
    let context = <SingleAssignmentView.AssignmentPreviewContext>Template.currentData();
    return Assignment.createFromDAO(context.assignmentDao);
  }
});


Template["assignmentPreview"].events({

  "click .panel-heading": function (e: Event, template: Blaze.TemplateInstance) {
    e.preventDefault();
    let instance = Template.instance();
    let context = <SingleAssignmentView.AssignmentPreviewContext>Template.currentData();

    // Erst Collapse Event auslösen, wenn die reaktiven Berechnungen durchgeführt werden.
    // Dies wird erreicht, in dem das Collapsing in einer Extra-Berechnung (oder Thread) ausgeführt wird.
    _.defer(function () {

      $("#" + SingleAssignmentView.createHtmlId(context)).collapse("toggle");
    }, 5);


  },
});

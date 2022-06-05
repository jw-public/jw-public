import * as moment from 'moment';
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Session } from "meteor/session";
import { Mongo } from "meteor/mongo";

import * as TemplateFunctionality from "../../../imports/templateModules/ManageAssignments";
import * as AssignmentForm from "../components/assignmentForm/AssignmentForm";
import * as AssignmentManager from "../components/assignmentManager/AssignmentManager";
import * as AssignmentManagerModal from "../components/assignmentManager/AssignmentManagerModal";
import { AssignmentState } from '../../../collections/lib/classes/AssignmentState';

import Group from "../../../collections/lib/classes/Group";
import { GroupApplicationController } from "../../../collections/lib/classes/Group";

import { AssignmentDAO } from '../../../collections/lib/AssignmentsCollection';
//import * as QuickFormModal from "../components/quickformModal/quickformModal";
import * as ServerMethodsWrapper from "../../../lib/classes/ServerMethodsWrapper";
import { DateRangeChooser } from "../../../imports/ui/assignments/DateRangeChooser";

import { ReactiveVar } from "meteor/reactive-var";
import { ReactiveVarWrapper } from '../../../imports/common/ReactiveVarWrapper';
import { Helper } from "../../../lib/HelperDecorator";
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';




Template["manageAssignments"].helpers({
  assignmentFilter(): Mongo.Selector { // Zusätzlicher Selektor für die Tabelle, damit nur Bewerber für die spezielle Gruppe angezeigt werden.
    let filterStartDate = TemplateFunctionality.filterStartDate().get();
    let filterEndDate = TemplateFunctionality.filterEndDate().get();


    let filter = {
      group: FlowRouter.getParam("groupId"),
      start: { "$gte": filterStartDate },
      end: { "$lte": filterEndDate }
    };

    console.log("New filter: ", filter);
    return filter;
  },
  filterStartDate(): ReactiveVar<Date> {
    return TemplateFunctionality.filterStartDate();
  },
  filterEndDate(): ReactiveVar<Date> {
    return TemplateFunctionality.filterEndDate();
  },
  DateRangeChooser() {
    return DateRangeChooser;
  },
  currentGroup(): Group {
    return new Group(FlowRouter.getParam("groupId"));
  },
  selectedAssignment(): AssignmentDAO {
    return TemplateFunctionality.getSelectedAssignment(FlowRouter.getParam("groupId"));
  },
  isAssignmentSelected(): boolean {
    return TemplateFunctionality.isAssignmentSelected(FlowRouter.getParam("groupId"));
  },
  currentAssignmentFormOptions(): AssignmentForm.TemplateOptions {
    if (TemplateFunctionality.isAssignmentSelected(FlowRouter.getParam("groupId"))) {
      return {
        formType: "update",
        doc: TemplateFunctionality.getSelectedAssignment(FlowRouter.getParam("groupId")),
        resetOnSuccess: false,
        submitButtonText: "Änderung speichern",
        fontAwesomeLogo: "fa-floppy-o",
        headingText: "Daten ändern",
        currentGroupId: FlowRouter.getParam("groupId"),
        panelClass: "panel-danger",
        buttonClass: "btn-danger"
      };
    } else {

      var doc: AssignmentDAO = TemplateFunctionality.getCopiedAssignment(FlowRouter.getParam("groupId"));
      var copyAvailable: boolean = doc != null;

      if (copyAvailable) {
        return {
          formType: "insert",
          doc: doc,
          resetOnSuccess: false,
          submitButtonText: "Kopieren",
          fontAwesomeLogo: 'fa-clone',
          headingText: "Einsatz kopieren",
          currentGroupId: FlowRouter.getParam("groupId"),
          panelClass: "panel-info",
          buttonClass: "btn-primary"
        };
      } else {
        return {
          formType: "insert",
          doc: null,
          resetOnSuccess: true,
          submitButtonText: "Erstellen",
          fontAwesomeLogo: 'fa-plus',
          headingText: "Einsatz hinzufügen",
          currentGroupId: FlowRouter.getParam("groupId"),
          panelClass: "panel-primary",
          buttonClass: "btn-primary"
        };
      }
    }
  },

  assignmentManagerContext(): AssignmentManager.TemplateOptions {
    if (TemplateFunctionality.isAssignmentSelected(FlowRouter.getParam("groupId"))) {
      return {
        assignmentId: TemplateFunctionality.getSelectedAssignmentId(FlowRouter.getParam("groupId")),
        onSuccess() {
          var groupId: string = FlowRouter.getParam("groupId");
          TemplateFunctionality.resetSelection(groupId);
        }
      };
    } else {
      return null;
    }
  }
});


Template["assignmentOptions"].onCreated(function () {
});

Template["assignmentOptions"].events({
  "click .manage-assignment": function (event) {
    event.preventDefault();
    var data = <AssignmentDAO>Template.currentData();

    AssignmentManagerModal.dialog({
      assignmentId: data._id,
      onSuccess: function () {

      }
    });
  },
  "click .edit-assignment": function (event) {
    event.preventDefault();
    var data = <AssignmentDAO>Template.currentData();

    var groupId: string = FlowRouter.getParam("groupId");

    if (TemplateFunctionality.getSelectedAssignmentId(groupId) == data._id) {
      TemplateFunctionality.resetSelection(groupId);
    } else {
      TemplateFunctionality.resetClipboard(groupId);
      TemplateFunctionality.setSelectedAssignmentId(groupId, data._id);
    }
  },
  "click .copy-assignment": function (event) {
    event.preventDefault();
    var data = <AssignmentDAO>Template.currentData();

    var groupId: string = FlowRouter.getParam("groupId");

    if (TemplateFunctionality.getCopiedAssignmentId(groupId) == data._id) {
      TemplateFunctionality.resetClipboard(groupId);
    } else {
      TemplateFunctionality.resetSelection(groupId);
      TemplateFunctionality.setCopiedAssignmentId(groupId, data._id);
    }
  },
  "click .remove-assignment": function (event) {
    event.preventDefault();
    var data = <AssignmentDAO>Template.currentData();

    var groupId: string = FlowRouter.getParam("groupId");
    //console.log("log id:" + data._id);
    bootbox.confirm({
      message: "Den Termin wirklich löschen?",
      callback(result: boolean) {
        if (!result) {
          return;
        }
        var proxy = new ServerMethodsWrapper.AssignmentProxy(data._id);
        proxy.remove(function (error) {
          if (error) {
            console.error("Was trying to remove an assignment: ", error);
            alert("Fehler: " + error.toString());
          }
        });
      }
    });
  },
});

Template["assignmentOptions"].helpers({
  copyButtonClass: function () {
    var data = <AssignmentDAO>Template.currentData();
    var groupId: string = FlowRouter.getParam("groupId");
    if (TemplateFunctionality.getCopiedAssignmentId(groupId) == data._id) {
      return "btn-info";
    } else {
      return "btn-default";
    }
  },
  isClosed: function (): boolean {
    var data = <AssignmentDAO>Template.currentData();
    return data.state === AssignmentState[AssignmentState.Closed];
  },
  removeButtonClass() {
    return "btn-trash";
  },
});

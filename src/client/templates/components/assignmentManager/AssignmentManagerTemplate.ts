import * as _ from "underscore";

import Assignment from "../../../../collections/lib/classes/Assignment";
import User from "../../../../collections/lib/classes/User";
import * as AssignmentManager from "./AssignmentManager";

import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";

import { AutoForm } from "meteor/aldeed:autoform";


Template["assignmentManager"].helpers({
  hasParticipants(): boolean {
    let participantIds = AssignmentManager.getParticipantsArray(Template.instance()).list();
    return participantIds.length > 0;
  },
  tooltipCloseButton(): string {
    let participantIds = AssignmentManager.getParticipantsArray(Template.instance()).list();
    let valid = participantIds.length > 0
    if (valid) {
      return "Termin abschließen und Teilnehmer bestätigen";
    } else {
      return "Bitte zuerst Teilnehmer auswählen";
    }
  },
  participantEntries(): Array<AssignmentManager.UserItem> {
    let context = (<any>this) as AssignmentManager.TemplateOptions;
    let assignment = new Assignment(context.assignmentId);

    let participantIds = AssignmentManager.getParticipantsArray(Template.instance()).list();
    let userItems: Array<AssignmentManager.UserItem> = new Array();

    _.forEach(participantIds.array(), function (participant) {
      userItems.push({
        userId: participant,
        assignmentId: assignment.getAssignmentId(),
        parentInstance: Template.instance()
      });
    });

    return userItems;

  },
  hasApplicants(): boolean {
    let applicantIds = AssignmentManager.getApplicantsArray(Template.instance()).list();
    return applicantIds.length > 0;
  },
  applicantEntries(): Array<AssignmentManager.UserItem> {
    let context = (<any>this) as AssignmentManager.TemplateOptions;
    let assignment = new Assignment(context.assignmentId);

    let applicantIds = AssignmentManager.getApplicantsArray(Template.instance()).list();
    let userItems: Array<AssignmentManager.UserItem> = new Array();

    _.forEach(applicantIds.array(), function (applicantId) {
      userItems.push({
        userId: applicantId,
        assignmentId: assignment.getAssignmentId(),
        parentInstance: Template.instance()
      });
    });

    return userItems;

  },

  onCancelIsDefined(): boolean {
    let context = Template.currentData() as AssignmentManager.TemplateOptions;

    return !_.isUndefined(context.onCancel) && _.isFunction(context.onCancel);
  },
  additionalFormOptions(): AssignmentManager.NestedTemplate {
    return {
      parentInstance: Template.instance()
    };
  },
  participantSchema() {
    return AssignmentManager.AddParticipantSchema;
  },
  userList(): Array<Object> {

    let instance = Template.instance();

    if (!instance.subscriptionsReady()) {
      return null;
    }

    let context = Template.currentData() as AssignmentManager.TemplateOptions;
    let assignment = new Assignment(context.assignmentId);
    let groupId = assignment.getGroupId();

    // User ignorieren, die bereits vorhanden sind.
    let presentUsers = AssignmentManager.getPresentUserIds(instance);

    return Meteor.users.find({
      _id: {
        $nin: presentUsers
      },
      groups: {
        $in: [groupId],
      }
    }, { fields: { "profile.first_name": 1, "profile.last_name": 1 }, sort: { "profile.last_name": 1 } }).map(function (c: Meteor.User) {
      let user: User = new User(c._id);

      return {
        label: user.fullName,
        value: c._id
      };
    });
  },
  s2Opts() {
    return {
      placeholder: 'Benutzer'
    };
  }
});




Template["assignmentManager"].created = function () {
  let instance = Template.instance();
  let assignmentSubscription: Meteor.SubscriptionHandle = null;
  instance.autorun(function () {
    let context = Template.currentData() as AssignmentManager.TemplateOptions;
    assignmentSubscription = instance.subscribe("singleAssignment", context.assignmentId);
  });

  instance.autorun(function () {
    let context = Template.currentData() as AssignmentManager.TemplateOptions;
    if (assignmentSubscription != null && assignmentSubscription.ready()) {
      AssignmentManager.init();
    }
  });
};

Template["assignmentManager"].events({
  "click .close-application": function (event: Event) {
    event.preventDefault();

    const context = Template.currentData() as AssignmentManager.TemplateOptions;
    const templateInstance = Template.instance();

    const participantIds = AssignmentManager.getParticipantsArray(Template.instance()).list();
    const hasNoParticipants = participantIds.length > 0

    if (hasNoParticipants) {
      const dialog = bootbox.dialog({
        title: "Abschließen bestätigen",
        message: "Der Termin wird geschlossen und den restlichen Bewerbern wird abgesagt.\nAktion durchführen?",
        backdrop: true,
        buttons: {
          "yesButton": {
            label: "Ja",
            className: "btn-primary",
            callback: function () {
              dialog.modal('hide');
              AssignmentManager.closeAndSubmitAssignment(templateInstance, context.assignmentId);
            }
          },
          "noButton": {
            label: "Nein",
            className: "btn-default",
            callback: function () {
              dialog.modal('hide');
            }
          }
        }
      });
    } else {
      const dialog = bootbox.dialog({
        title: "Leeren Termin schließen",
        message: "Der Termin wird <b>ohne Teilnehmer</b> geschlossen. Allen Bewerbern wird abgesagt.",
        backdrop: true,
        buttons: {
          "yesButton": {
            label: "Ohne Teilnehmer schließen",
            className: "btn-warning",
            callback: function () {
              dialog.modal('hide');
              AssignmentManager.closeAndSubmitAssignment(templateInstance, context.assignmentId);
            }
          },
          "noButton": {
            label: "Abbrechen",
            className: "btn-default",
            callback: function () {
              dialog.modal('hide');
            }
          }
        }
      });
    }
  },
  "click .cancel": function (event: Event) {
    event.preventDefault();

    let context = Template.currentData() as AssignmentManager.TemplateOptions;

    if (!_.isUndefined(context.onCancel) && _.isFunction(context.onCancel)) {
      context.onCancel(event);
    }
  }
});

Template["applicantEntry"].helpers({
  user: function () {
    return User.createFromId(this.userId);
  }
});

Template["applicantEntry"].events({
  "click .toggle-application": AssignmentManager.toggleEventFunction
});

Template["participantEntry"].helpers({
  user: function () {
    return User.createFromId(this.userId);
  }
});

Template["participantEntry"].events({
  "click .toggle-application": AssignmentManager.toggleEventFunction
});

AutoForm.hooks<{ userId: string }>({
  "addUserAsParticipantForm": { // Die ID des Formulars
    onSubmit: function (toBeInserted) {
      let context = this as AutoForm.HookMethodContext<{ userId: string }>;
      context.event.preventDefault();
      let additionalOptions = context.template.data["additionalFormOptions"] as AssignmentManager.NestedTemplate;

      AssignmentManager.addParticipant(additionalOptions.parentInstance, toBeInserted.userId);
      context.resetForm();
      $("#s2id_userSelect2").select2("val", "");
      context.done(null, toBeInserted);
    }
  }
});

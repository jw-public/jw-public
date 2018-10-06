import * as _ from "underscore";
import * as AssignmentManager from "./AssignmentManager";

import {Meteor} from "meteor/meteor";
import {Template} from "meteor/templating";
import {Session} from "meteor/session";
import {Blaze} from "meteor/blaze";
import {ReactiveVar} from "meteor/reactive-var";

const HTML_ID = "AssignmentManagerModalDialogNode";

const DEFAULT_BOOTBOX_OPTIONS: BootboxDialogOptionsWithoutMessage = {
  title: "Termin abschließen"
};

export function dialog(templateOptions: AssignmentManager.TemplateOptions, bootboxoptions?: BootboxDialogOptionsWithoutMessage) { // this can be tied to an event handler in another template

  let wrappedTemplateOptions: AssignmentManager.TemplateOptions = {
    assignmentId: templateOptions.assignmentId,
    onSuccess: function() {
      bootbox.hideAll();
      if (!_.isUndefined(templateOptions.onSuccess) && _.isFunction(templateOptions.onSuccess)) {
        templateOptions.onSuccess();
      }
    },
    onCancel: function(event) {
      bootbox.hideAll();
      if (!_.isUndefined(templateOptions.onCancel) && _.isFunction(templateOptions.onCancel)) {
        templateOptions.onCancel(event);
      }
    },
  };

  if (!bootboxoptions) {
    bootboxoptions = {};
  }

  _.defaults(bootboxoptions, DEFAULT_BOOTBOX_OPTIONS);

  bootboxoptions["message"] = "<div id='" + HTML_ID + "'></div>";
  bootbox.dialog(<BootboxDialogOptions>bootboxoptions);

  Blaze.renderWithData(
    Template["assignmentManager"],
    wrappedTemplateOptions,
    $("#" + HTML_ID).get(0)
    );
};

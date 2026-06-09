import * as _ from "underscore";
import * as React from "react";
import { createRoot } from "react-dom/client";

import AssignmentManagerComponent, { AssignmentManagerProps } from "./AssignmentManagerComponent";

const HTML_ID = "AssignmentManagerModalDialogNode";

const DEFAULT_BOOTBOX_OPTIONS: BootboxDialogOptionsWithoutMessage = {
  title: "Termin abschließen"
};

export function dialog(templateOptions: AssignmentManagerProps, bootboxoptions?: BootboxDialogOptionsWithoutMessage) { // this can be tied to an event handler in another template

  let wrappedTemplateOptions: AssignmentManagerProps = {
    assignmentId: templateOptions.assignmentId,
    onSuccess: function () {
      bootbox.hideAll();
      if (!_.isUndefined(templateOptions.onSuccess) && _.isFunction(templateOptions.onSuccess)) {
        templateOptions.onSuccess();
      }
    },
    onCancel: function (event) {
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
  let dialogElement = bootbox.dialog(<BootboxDialogOptions>bootboxoptions);

  // Mount the React manager directly (no Blaze hop) and unmount when the
  // dialog goes away.
  const node = $("#" + HTML_ID).get(0);
  const root = createRoot(node);
  root.render(React.createElement(AssignmentManagerComponent, wrappedTemplateOptions));

  (<any>dialogElement).on("hidden.bs.modal", function () {
    root.unmount();
  });
};

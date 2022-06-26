import { Blaze } from "meteor/blaze";
import { Template } from "meteor/templating";

import { AutoForm } from "meteor/aldeed:autoform";

const HTML_ID = "QuickformModalDialogNode";

export function dialog<T>(quickformOptions: AutoForm.QuickFormOptions<T>, bootboxoptions?: BootboxDialogOptionsWithoutMessage) { // this can be tied to an event handler in another template

  if (!bootboxoptions) {
    bootboxoptions = {};
  }

  bootboxoptions["message"] = "<div id='" + HTML_ID + "'></div>";
  bootbox.dialog(<BootboxDialogOptions>bootboxoptions);

  Blaze.renderWithData(
    Template["quickForm"],
    quickformOptions,
    $("#" + HTML_ID).get(0)
  );
};

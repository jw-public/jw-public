
import { Blaze } from "meteor/blaze";
import { Template } from "meteor/templating";

Template["backButton"].events({
  'click button': function (e: Event, template: Blaze.TemplateInstance) {
    e.preventDefault();
    window.history.back();
  }
});

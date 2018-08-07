
import {Meteor} from "meteor/meteor";
import {Template} from "meteor/templating";
import {Blaze} from "meteor/blaze";

Template["backButton"].events({
  'click button': function(e: Event, template: Blaze.TemplateInstance) {
    e.preventDefault();
    window.history.back();
  }
});

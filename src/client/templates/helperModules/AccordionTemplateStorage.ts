import * as _ from "underscore";
import {Meteor} from "meteor/meteor";
import {Template} from "meteor/templating";
import {Session} from "meteor/session";
import {Mongo} from "meteor/mongo";
import {Blaze} from "meteor/blaze";
import {ReactiveVar} from "meteor/reactive-var";

const KEY_COLLAPSED_VAR = "_col_var";

function isCollapsedVarInitialised(templateInstance: Blaze.TemplateInstance): boolean {
  return !_.isUndefined(templateInstance[KEY_COLLAPSED_VAR]);
}

function initCollapsedVar(templateInstance: Blaze.TemplateInstance): void {
  templateInstance[KEY_COLLAPSED_VAR] = new ReactiveVar<boolean>(true);
}

function getCollapsedVar(templateInstance: Blaze.TemplateInstance): ReactiveVar<boolean> {
  if (!isCollapsedVarInitialised(templateInstance)) {
    initCollapsedVar(templateInstance);
  }

  return templateInstance[KEY_COLLAPSED_VAR];
}

export function isCollapsed(templateInstance: Blaze.TemplateInstance): boolean {
  return getCollapsedVar(templateInstance).get();
}

export function setCollapsed(templateInstance: Blaze.TemplateInstance, isCollapsed: boolean) {
  getCollapsedVar(templateInstance).set(isCollapsed);
}

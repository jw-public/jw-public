import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import * as _ from "underscore";

import { getAllFunctionsOf } from "./DecoratorCommons";

export function TemplateDefinition(templateName: string) {
  return function (someClass: Object) {
    if (!Meteor.isClient) {
      return;
    }

    let functions = getAllFunctionsOf(someClass);

    let helperMethods = extractHelperMethods(functions);
    registerAsHelperMethods(templateName, helperMethods);

    let eventHandlers = extractEventHandlers(functions);
    registerAsEventHandlers(templateName, eventHandlers);
  };
}


function extractHelperMethods(functionArray: Array<Function>): Array<Function> {
  return functionArray.filter(function (someMethod: any) {
    return someMethod["__isHelper__"];
  });
}

function registerAsHelperMethods(templateName: string, functionArray: Array<Function>): void {
  _.forEach(functionArray, function (singleHelper) {
    let helpersObj: any = {};

    helpersObj[singleHelper["__helperName__"]] = singleHelper;
    Template[templateName].helpers(helpersObj);
  });
}

function extractEventHandlers(functionArray: Array<Function>): Array<Function> {
  return functionArray.filter(function (someMethod: any) {
    return someMethod["__isEventHandler__"];
  });
}

function registerAsEventHandlers(templateName: string, functionArray: Array<Function>): void {
  _.forEach(functionArray, function (eventHandler) {
    let eventHandlerObj: any = {};

    eventHandlerObj[eventHandler["__selector__"]] = eventHandler;
    let template: Template = Template[templateName];
    template.events(eventHandlerObj);
  });
}

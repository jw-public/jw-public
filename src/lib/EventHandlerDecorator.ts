
import {Meteor} from "meteor/meteor";
import {Template} from "meteor/templating";
import {Session} from "meteor/session";
import {Mongo} from "meteor/mongo";






  export function EventHandler(selector: string) {
    return (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => {
      if (!Meteor.isClient) {
        return;
      }
      let eventHandler = target[propertyKey];
      markFunctionAsEventHandler(eventHandler, selector);
    };
  }

  function markFunctionAsEventHandler(eventHandler: Function, selector: string) {
    eventHandler["__isEventHandler__"] = true;
    eventHandler["__selector__"] = selector;
  }

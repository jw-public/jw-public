import {Meteor} from "meteor/meteor";

  export function Helper(target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) {
    if (!Meteor.isClient) {
      return;
    }

    let helperFunction = target[propertyKey];
    markFunctionAsHelperMethod(helperFunction, propertyKey.toString());
  }

  function markFunctionAsHelperMethod(helperFunction: Function, nameOfMethod: string) {
    helperFunction["__isHelper__"] = true;
    helperFunction["__helperName__"] = nameOfMethod;
  }

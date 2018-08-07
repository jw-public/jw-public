function toType(obj: any): string {
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}

/**
* Determines, whether we may access the property with the given name.
* The browser Safary prohibits access to those named within the function.
*/
function isPropertyWhichMayBeAccessedViaJavascript(propertyName: string): boolean {
  return propertyName !== "arguments" && propertyName !== "caller";
}


export function getAllFunctionsOf(object: any): Array<Function> {
  return getAllFunctionNamesOf(object).map(function(functionName) {
    return object[functionName];
  });
}

export function getAllFunctionNamesOf(object: any): Array<string> {
  return Object.getOwnPropertyNames(object).filter(function(property) {
    return isPropertyWhichMayBeAccessedViaJavascript(property) && toType(object[property]) === "function";
  });
}

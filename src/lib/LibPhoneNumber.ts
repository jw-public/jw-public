// Replacement for the emgee:libphonenumber atmosphere wrapper (2014, breaks
// the Meteor 3 module runtime). Same underlying Google library via npm.
const glpn = require("google-libphonenumber");

export const phoneUtil: any = glpn.PhoneNumberUtil.getInstance();
export const PhoneNumberFormat: any = glpn.PhoneNumberFormat;

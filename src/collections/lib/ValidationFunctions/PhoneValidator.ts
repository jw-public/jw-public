import * as LibPhoneNumber from "../../../lib/LibPhoneNumber";

  export function isValidNumber(phoneNumber: string) {
    let util = LibPhoneNumber.phoneUtil;
    try {
      let parsedNumber = util.parse(phoneNumber, "DE");
      return util.isValidNumber(parsedNumber);
    } catch (err) {
      return false;
    }
  }

declare module LibPhoneNumber {
  const phoneUtil: PhoneUtilStatic;
  export enum PhoneNumberFormat {
    E164,
    INTERNATIONAL,
    NATIONAL,
    RFC3966,
  }

  export enum PhoneNumberType {
    FIXED_LINE,
    MOBILE,
    // In some regions (e.g. the USA), it is impossible to distinguish between
    // fixed-line and mobile numbers by looking at the phone number itself.
    FIXED_LINE_OR_MOBILE,
    // Freephone lines
    TOLL_FREE,
    PREMIUM_RATE,
    // The cost of this call is shared between the caller and the recipient, and
    // is hence typically less than PREMIUM_RATE calls. See
    // http://en.wikipedia.org/wiki/Shared_Cost_Service for more information.
    SHARED_COST,
    // Voice over IP numbers. This includes TSoIP (Telephony Service over IP).
    VOIP,
    // A personal number is associated with a particular person, and may be routed
    // to either a MOBILE or FIXED_LINE number. Some more information can be found
    // here: http://en.wikipedia.org/wiki/Personal_Numbers
    PERSONAL_NUMBER,
    PAGER,
    // Used for 'Universal Access Numbers' or 'Company Numbers'. They may be
    // further routed to specific offices, but allow one number to be used for a
    // company.
    UAN,
    // Used for 'Voice Mail Access Numbers'.
    VOICEMAIL,
    // A phone number is of type UNKNOWN when it does not fit any of the known
    // patterns for a specific region.
    UNKNOWN
  }

  interface PhoneUtilStatic {
    /**
     * Parses a string and returns it in proto buffer format. This method will throw
     * a {@link i18n.phonenumbers.Error} if the number is not considered to be a
     * possible number. Note that validation of whether the number is actually a
     * valid number for a particular region is not performed. This can be done
     * separately with {@link #isValidNumber}.
     *
     * @param {?string} numberToParse number that we are attempting to parse. This
     *     can contain formatting such as +, ( and -, as well as a phone number
     *     extension. It can also be provided in RFC3966 format.
     * @param {?string} defaultRegion region that we are expecting the number to be
     *     from. This is only used if the number being parsed is not written in
     *     international format. The country_code for the number in this case would
     *     be stored as that of the default region supplied. If the number is
     *     guaranteed to start with a '+' followed by the country calling code, then
     *     'ZZ' or null can be supplied.
     * @return {i18n.phonenumbers.PhoneNumber} a phone number proto buffer filled
     *     with the parsed number.
     * @throws {Error} if the string is not considered to be a
     *     viable phone number or if no default region was supplied and the number
     *     is not in international format (does not start with +).
     */
    parse: (numberToParse?: string, defaultRegion?: string) => PhoneNumber;
    /**
    * Formats a phone number in the specified format using default rules. Note that
    * this does not promise to produce a phone number that the user can dial from
    * where they are - although we do format in either 'national' or
    * 'international' format depending on what the client asks for, we do not
    * currently support a more abbreviated format, such as for users in the same
    * 'area' who could potentially dial the number without area code. Note that if
    * the phone number has a country calling code of 0 or an otherwise invalid
    * country calling code, we cannot work out which formatting rules to apply so
    * we return the national significant number with no formatting applied.
    *
    * @param {i18n.phonenumbers.PhoneNumber} number the phone number to be
    *     formatted.
    * @param {i18n.phonenumbers.PhoneNumberFormat} numberFormat the format the
    *     phone number should be formatted into.
    * @return {string} the formatted phone number.
    */
    format: (number: PhoneNumber, numberFormat: PhoneNumberFormat) => string;

    /**
     * Tests whether a phone number matches a valid pattern. Note this doesn't
     * verify the number is actually in use, which is impossible to tell by just
     * looking at a number itself.
     *
     * @param {i18n.phonenumbers.PhoneNumber} number the phone number that we want
     *     to validate.
     * @return {boolean} a boolean that indicates whether the number is of a valid
     *     pattern.
     */
    isValidNumber: (phoneNumber: PhoneNumber) => boolean;

  }

  class PhoneNumber {
    public thisIsJustABadStyle(); // Damit die Klasse PhoneNumber einzigartig ist.
  }
}

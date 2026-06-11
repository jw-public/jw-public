import SimpleSchema from "./SimpleSchema";

/**
 * Fehlermeldungen (simpl-schema / message-box Format)
 */
SimpleSchema.setDefaultMessages({
  messages: {
    en: {
      required: "{{{label}}} muss angegeben werden",
      minString: "{{{label}}} muss mindestens {{min}} Zeichen lang sein",
      maxString: "{{{label}}} darf nicht länger als {{max}} Zeichen sein",
      minNumber: "{{{label}}} muss mindestens {{min}} sein",
      maxNumber: "{{{label}}} darf nicht größer als {{max}} sein",
      minNumberExclusive: "{{{label}}} muss größer als {{min}} sein",
      maxNumberExclusive: "{{{label}}} muss kleiner als {{max}} sein",
      minDate: "{{{label}}} muss am oder nach dem Datum {{min}} sein",
      maxDate: "{{{label}}} kann nicht nach dem {{max}} sein",
      badDate: "{{{label}}} ist kein gültiges Datum",
      minCount: "Es müssen mindestens {{minCount}} Werte angegeben werden",
      maxCount: "Es können nicht mehr als {{maxCount}} angegeben werden",
      noDecimal: "{{{label}}} muss eine ganze Zahl sein",
      notAllowed: "{{{value}}} ist kein erlaubter Wert",
      expectedType: "{{{label}}} muss vom Typ {{dataType}} sein",
      keyNotInSchema: "{{name}} ist im Schema nicht erlaubt",
      userAlreadyExisting:
        "Diese E-Mail Adresse ist leider schon vorhanden. Wenn du schon registriert bist, so gehe bitte zurück und gib dort deine Adresse erneut ein.",
      groupIdNotValid: "Die angegebene Gruppe existiert nicht.",
      passwordMissmatch: "Die eingegebenen Passwörter stimmen nicht überein",
      timezoneNotValid: "Zeitzone nicht gültig",
      phoneNumberInvalid: "Die Telefonnummer ist ungültig",
      regEx({ label, regExp }: { label: string; regExp: string }) {
        switch (regExp) {
          case SimpleSchema.RegEx.Email.toString():
          case SimpleSchema.RegEx.EmailWithTLD.toString():
            return label + " muss eine gültige E-Mail-Adresse sein";
          case SimpleSchema.RegEx.Url.toString():
            return label + " muss eine gültige URL sein";
          case SimpleSchema.RegEx.Id.toString():
            return label + " muss eine gültige alphanumerische ID sein";
          default:
            return label + " hat kein gültiges Format";
        }
      },
    },
  },
});

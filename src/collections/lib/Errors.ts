
/**
 * Fehlermeldungen
 */
SimpleSchema.messages({
    required: "[label] muss angegeben werden",
    minString: "[label] muss mindestens [min] Zeichen lang sein",
    maxString: "[label] darf nicht länger als [max] Zeichen sein",
    minNumber: "[label] muss mindestens [min] sein",
    maxNumber: "[label] darf nicht größer als [max] sein",
    minDate: "[label] muss am oder nach dem Datum [min] sein",
    maxDate: "[label] kann nicht nach dem [max] sein",
    badDate: "[label] ist kein gültiges Datum",
    minCount: "Es müssen mindestens [minCount] Werte angegeben werden",
    maxCount: "Es können nicht mehr als [maxCount] angegeben werden",
    noDecimal: "[label] muss eine ganze Zahl sein",
    notAllowed: "[value] ist kein erlaubter Wert",
    expectedString: "[label] muss eine Zeichenkette sein",
    expectedNumber: "[label] muss eine Nummer sein",
    expectedBoolean: "[label] muss ein Wahrheitswert sein",
    expectedArray: "[label] muss ein Datenfeld (Array) sein",
    expectedObject: "[label] muss ein \"object\" sein",
    expectedConstructor: "[label] muss vom Typ [type] sein",
    userAlreadyExisting: "Diese E-Mail Adresse ist leider schon vorhanden. Wenn du schon registriert bist, so gehe bitte zurück und gib dort deine Adresse erneut ein.",
    groupIdNotValid: "Die angegebene Gruppe existiert nicht.",
    regEx: [
        {msg: "[label] hat kein gültiges Format"},
        {exp: SimpleSchema.RegEx.Email, msg: "[label] muss eine gültige E-Mail-Adresse sein"},
        {exp: SimpleSchema.RegEx.WeakEmail, msg: "[label] muss eine gültige E-Mail-Adresse sein"},
        {exp: SimpleSchema.RegEx.Domain, msg: "[label] must be a valid domain"},
        {exp: SimpleSchema.RegEx.WeakDomain, msg: "[label] must be a valid domain"},
        {exp: SimpleSchema.RegEx.IP, msg: "[label] must be a valid IPv4 or IPv6 address"},
        {exp: SimpleSchema.RegEx.IPv4, msg: "[label] must be a valid IPv4 address"},
        {exp: SimpleSchema.RegEx.IPv6, msg: "[label] must be a valid IPv6 address"},
        {exp: SimpleSchema.RegEx.Url, msg: "[label] muss eine gültige URL sein"},
        {exp: SimpleSchema.RegEx.Id, msg: "[label] muss eine gültige alphanumerische ID sein"}
    ],
    keyNotInSchema: "[key] is not allowed by the schema",
    passwordMissmatch: "Die eingegebenen Passwörter stimmen nicht überein",
    timezoneNotValid: "Zeitzone nicht gültig",
    mustBeCoordinator: "Der Nutzer muss ein Koordinator der Gruppe sein",
    phoneNumberInvalid: "Das ist leider keine gültige Telefonnummer"
});

import { AssignmentDAO } from "../../../../collections/lib/AssignmentsCollection";

import * as moment from "moment";
require("moment-duration-format");

import { Tracker } from "meteor/tracker";

/**
 * Config für die verwendeten Elemente.
 * @type {{selectors: {dateTimePicker: string, durationSlider: string}}}
 */
export const config = {
    selectors: {
        dateTimePicker: "div.datetimepicker",
        durationValueInput: "input#duration",
        durationDisplay: "#durationDisplay",
        buttons: "button.increase"
    },
    boundaries: { // Minimaler und maximaler Wert der Dauer
        lower: 15,
        upper: (8 * 60)
    },
    defaultDuration: (2 * 60) // 2 Stunden
};



/* Zugriff auf das Datum und das Deklarieren einer Abhängigkeit. */
// Bei einer Änderung des Datums informieren wir Meteor, dass sich die Selektion geändert hat.
// Hierbei wird mit dem Modul Tracker (https://atmospherejs.com/meteor/tracker) interagiert.
export var dateSelectionDep = new Tracker.Dependency; // Stellt die Abhängigkeit von der Datums-Auswahl dar.
export var durationSelectionDep = new Tracker.Dependency; // Stellt die Abhängigkeit von der Auswahl der Dauer dar.


/**
 * Ein reaktiver Getter für die Auswahl eines Datums und Uhrzeit des DateTimePicker.
 * @returns {*} Ein Date-Objekt, falls eine Auswahl getroffen ist, ansonsten null.
 */
export var getSelectedStartDate = function (): moment.Moment {
    dateSelectionDep.depend(); // Diese Funktion hängt von der Datums-Auswahl ab.
    let datepickerObject = getDateTimePicker();
    if (datepickerObject == null) {
        return null;
    } else {
        return moment(datepickerObject.date());
    }
};

/**
 * Ein reaktiver Getter für die Auswahl der Dauer in Minuten.
 * @returns {int} Die Anzahl der gewählten Minuten für die Dauer.
 */
export var getSelectedDuration = function (): number {
    durationSelectionDep.depend(); // Diese Funktion hängt von der Auswahl der Dauer ab.
    let value: number = Number(getDurationValueInput().val());
    return value;
};

/**
 * Ein reaktiver Getter, der den gewünschten Endzeitpunkt eines Einsatzes berechnet.
 * @returns {moment} Null, wenn keine Auswahl getroffen wurde, ansonsten der Berechnete Endzeitpunkt als moment.js
 */
export var getSelectedEndDate = function (): moment.Moment {
    let startDate: moment.Moment = getSelectedStartDate();

    if (startDate == null) {
        return null;
    }

    let minutesDuration = getSelectedDuration();

    let endDate = moment(startDate).add(minutesDuration, 'minutes');

    return endDate;
}

/**
 * Ein reaktiver Setter, der den gewünschten Startzeitpunkt eines Einsatzes setzt.
 */
export var setSelectedStartDate = function (startDate: moment.Moment): void {

    let datepickerObject = getDateTimePicker();
    if (!datepickerObject) {
        return;
    }

    console.log("Setting start date");
    datepickerObject.date(startDate);
    dateSelectionDep.changed(); // Der Abhängigkeit bescheid geben, dass sich die Datums-Auswahl geändert hat.
}

/**
 * Ein reaktiver Setter, der den gewünschten Startzeitpunkt eines Einsatzes setzt.
 */
export var setSelectedEndDate = function (startDate: moment.Moment, endDate: moment.Moment): void {

    var duration = moment.duration(endDate.diff(startDate));
    var minutes: number = Math.round(duration.asMinutes());

    setDurationValue(minutes);
}

function getDurationValueInput(): JQuery {
    return $(config.selectors.durationValueInput);
}

function getDurationDisplay(): JQuery {
    return $(config.selectors.durationDisplay);
}

export function setDurationValue(minutes: number): void {
    getDurationValueInput().val(minutes.toString());
    durationSelectionDep.changed();
}

export function resetDurationToDefault(): void {
    setDurationValue(config.defaultDuration);
}

export function increaseDurationBy(minutes: number): number {
    var curVal: number = getSelectedDuration();
    curVal += minutes;

    curVal = Math.max(curVal, config.boundaries.lower);
    curVal = Math.min(curVal, config.boundaries.upper);

    setDurationValue(curVal);
    return curVal;
}

export function decreaseDurationBy(minutes: number): number {
    return increaseDurationBy(-minutes);
}

export function getDateTimePicker(): BootstrapV3DatetimePicker.Datetimepicker {
    return $(config.selectors.dateTimePicker).data("DateTimePicker");
}


/**
 * Formatiert eine Minutenangabe zu einer Stunden und Minuten Angabe. Beispiel: 70 Minuten werden zu "1 Stunde und 10 Minuten".
 * @param {int} value Gesamtzahl Minuten
 * @returns {string} Eine formatierte Zeitangabe mit Stunden und Minuten
 */
export function formatDuration(value: number): string {
    var duration = moment.duration(value, 'minutes');
    var hours = duration.hours();
    var minutes = duration.minutes();
    var formatted = "";
    if (hours == 1) {
        formatted = hours + " Stunde";
    } else if (hours > 0) {
        formatted = hours + " Stunden";
    }
    if (hours > 0 && minutes > 0) {
        formatted += " und "
    }
    if (minutes > 0) {
        formatted += minutes + " Minuten"
    }
    return formatted;
};

export function formatDurationShort(value: number): string {
    var duration = moment.duration(value, 'minutes');

    return duration.format('h[h ] m[min]');
}

export interface TemplateOptions {
    formType: string;
    doc: AssignmentDAO;
    resetOnSuccess: boolean;
    submitButtonText: string;
    fontAwesomeLogo: string;
    headingText: string;
    currentGroupId: string;
    panelClass: string;
    buttonClass: string;
}

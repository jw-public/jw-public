

import { AssignmentState } from "../../../../collections/lib/classes/AssignmentState";

import * as AssignmentForm from "./AssignmentForm";

import { Blaze } from "meteor/blaze";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";

import User from "../../../../collections/lib/classes/User";

import { AssignmentDAO, Assignments } from "../../../../collections/lib/AssignmentsCollection";
import Group from "../../../../collections/lib/classes/Group";
import { GroupDAO, Groups } from "../../../../collections/lib/GroupCollection";

import { AutoForm } from "meteor/aldeed:autoform";

import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import * as moment from "moment";


Template["assignmentForm"].onCreated(function () {

    let instance = Template.instance();

    instance.autorun(() => {
        let data = <AssignmentForm.TemplateOptions>Template.currentData();
        instance.subscribe("singleGroup", data.currentGroupId);
        instance.subscribe("groupCoordinators", data.currentGroupId);
    });

});


/**
 * ------------ onRendered() ------------
 */
Template["assignmentForm"].onRendered(function () {

    var instance = Template.instance();

    var data = <AssignmentForm.TemplateOptions>Template.currentData();

    /* ---- DateTimePicker Initialisierung ---- */

    var datepicker = $(AssignmentForm.config.selectors.dateTimePicker).datetimepicker({
        locale: 'de',
        minDate: moment(), // Das heutige Datum als früheste Option zulassen
        inline: true,
        sideBySide: true,
        stepping: 15 // In 15 Minuten-Schritten die Zeit ändern
    });

    // Bei einer Änderung des Datums informieren wir Meteor, dass sich die Selektion geändert hat.
    // Hierbei wird mit dem Modul Tracker (https://atmospherejs.com/meteor/tracker) interagiert.
    datepicker.on("dp.change", function (e) {
        console.log("Date hat sich geändert", e.date.calendar());
        AssignmentForm.dateSelectionDep.changed(); // Der Abhängigkeit bescheid geben, dass sich die Datums-Auswahl geändert hat.
    });
    AssignmentForm.dateSelectionDep.changed(); // Die Abhängigkeitsüberwachung inital triggern.


    if (!data.doc) {
        var initStartDate = moment().add(1, 'days').hour(12).minutes(0);

        AssignmentForm.setSelectedStartDate(initStartDate);
        AssignmentForm.resetDurationToDefault();
    } else {
        AssignmentForm.setSelectedStartDate(moment(data.doc.start));
        AssignmentForm.setSelectedEndDate(moment(data.doc.start), moment(data.doc.end));
    }


});

Template["assignmentForm"].events({
    'click button.increase': function (e: Event, template: Blaze.TemplateInstance) {
        e.preventDefault();
        var increaseBy: number = Number($(e.target).data("increase-by"));
        AssignmentForm.increaseDurationBy(increaseBy);
    }

});

/**
 * ------------ Helpers ------------
 */
Template["assignmentForm"].helpers({
    selectedDate(): string {
        var date = AssignmentForm.getSelectedStartDate(); // Ist reaktiv. Wird durch dateSelectionDep erreicht.
        if (date != null) {
            return date.format('llll') + " Uhr";
        } else {
            return null;
        }
    },
    selectedDateObject(): Date {
        var date = AssignmentForm.getSelectedStartDate(); // Ist reaktiv. Wird durch dateSelectionDep erreicht.
        if (date != null) {
            return moment(AssignmentForm.getSelectedStartDate()).toDate();
        } else {
            return null;
        }
    },
    isDateSelected(): boolean {
        var date = AssignmentForm.getSelectedStartDate(); // Ist reaktiv. Wird durch dateSelectionDep erreicht.
        return moment(date).isValid();
    },
    selectedDuration(): string {
        return AssignmentForm.formatDuration(AssignmentForm.getSelectedDuration()); // Ist reaktiv.
    },
    selectedDurationShort(): string {
        return AssignmentForm.formatDurationShort(AssignmentForm.getSelectedDuration()); // Ist reaktiv.
    },
    calculatedEndDateObject(): Date {
        var date = AssignmentForm.getSelectedEndDate(); // Ist reaktiv. Wird durch dateSelectionDep und durationSelectionDep erreicht.
        if (date != null) {
            return date.toDate(); // Ist ein moment.js-Objekt. Deswegen Umwandeln zu Date-Objekt.
        } else {
            return null;
        }
    },
    currentGroup(): GroupDAO {
        return Groups.findOne({ "_id": FlowRouter.getParam("groupId") });
    },
    stateOption(): Array<Object> {
        return [{
            label: "Nein",
            value: "Online"
        }, {
            label: "Ja",
            value: "Closed"
        }];
    },
    contactOptions(): Array<Object> {

        let instance = Template.instance();

        if (!instance.subscriptionsReady()) {
            return null;
        }

        let data = <AssignmentForm.TemplateOptions>Template.currentData();

        let group = new Group(data.currentGroupId);

        return Meteor.users.find({
            _id: {
                $in: group.getCoordinatorIds(),
            }
        }, { fields: { "profile.first_name": 1, "profile.last_name": 1 } }).map(function (c: Meteor.User) {
            return {
                label: User.createFromDAO(c).fullName,
                value: c._id
            };
        });
    },
    isCanceled(): boolean {
        let data = <AssignmentForm.TemplateOptions>Template.currentData();
        return data.doc != null && AssignmentState[data.doc.state] == AssignmentState.Canceled;
    },
    assignmentsCollection() {
        return Assignments;
    }



});


/**
 * Hier bestimmen wir das Verhalten der Formulare.
 */
AutoForm.hooks<AssignmentDAO>({
    "assignmentForm": { // Die ID des Formulars
        docToForm: function (doc: AssignmentDAO, ss: SimpleSchema): Object {
            AssignmentForm.setSelectedStartDate(moment(doc.start));
            AssignmentForm.setSelectedEndDate(moment(doc.start), moment(doc.end));

            return doc;
        }
    }
});

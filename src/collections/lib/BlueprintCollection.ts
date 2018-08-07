import { defaults } from './../../client/react/components/SmallProgressbar/SmallProgressbar';
import { BlueprintAssignmentDAO, WeekBlueprint } from './../../imports/blueprint/interfaces/WeekBlueprint.d';
import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

export const Blueprints = new Mongo.Collection<WeekBlueprint>("blueprints");



export const SingleBlueprintSchema = new SimpleSchema({
    isoWeekday: {
        type: Number,
        min: 0,
        max: 31
    },
    startHour: {
        type: Number,
        min: 0,
        max: 24
    },
    startMinute: {
        type: Number,
        min: 0,
        max: 60
    },
    durationMinutes: {
        type: Number,
        min: 0,
        max: 60 * 10
    },
    note: {
        type: String,
        label: "Notiz",
        optional: true
    },
    userGoal: {
        type: Number,
        label: "Teilnehmer-Ziel (bei 0 wird keine Belegung angezeigt)",
        optional: true,
        min: 0,
        defaultValue: 0
    },
    name: {
        type: String,
        label: "Name des Einsatzes"
    },
    "pickup_point": {
        type: String,
        optional: true,
        label: "Abholung"
    },
    "return_point": {
        type: String,
        label: "Rückgabe",
        optional: true
    }
});


export const WeekBlueprintSchema = new SimpleSchema({
    assignments: {
        type: [SingleBlueprintSchema],
        label: "Termine",
        defaultValue: new Array()
    },
    group: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        index: 1
    },
    name: {
        type: String,
        label: "Name der Terminschablone"
    },
    // Force value to be current date (on server) upon insert
    // and prevent updates thereafter.
    createdAt: {
        type: Date,
        autoValue: function () {
            if (this.isInsert) {
                return new Date;
            } else if (this.isUpsert) {
                return { $setOnInsert: new Date };
            } else {
                this.unset();
            }
        },
        optional: true
    },
    // Force value to be current date (on server) upon update
    // and don't allow it to be set upon insert.
    updatedAt: {
        type: Date,
        autoValue: function () {
            if (this.isUpdate) {
                return new Date();
            }
        },
        denyInsert: true,
        optional: true
    }
});

Blueprints.attachSchema(WeekBlueprintSchema);

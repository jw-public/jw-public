import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

import Assignment from "./classes/Assignment";
import { AssignmentState } from "./classes/AssignmentState";

import * as EnumUtil from "./classes/EnumUtil";

import { CollectionConf } from "./collectionConfig/CollectionConf";

export interface UserEntry {
  user?: string;
  when?: Date;
}

export interface AssignmentDAO {
  _id?: string;
  name?: string;
  group?: string;
  copyActionId?: string;
  start?: Date;
  end?: Date;
  participants?: Array<UserEntry>;
  applicants?: Array<UserEntry>;
  note?: string;
  state?: string;
  stateBeforeLastClose?: string;
  cancelationReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
  creator?: string;
  pickup_point?: string;
  return_point?: string;
  userGoal?: number;
  contacts?: Array<string>;
  month?: number;
  year?: number;
  isoWeek?: number;
  yearOfIsoWeek?: number;
}


const AssignmentStateNames = EnumUtil.getNames(AssignmentState);

export const Assignments = new Mongo.Collection<AssignmentDAO>("assignments");



export const AssignmentUserEntrySchema = new SimpleSchema({ // Siehe AssignmentSchema.applicants und AssignmentSchema.participants
  user: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  when: {
    type: Date,
    autoValue: function () {
      if (this.isUpdate && this.operator !== "$pull") {
        return new Date();
      }
    }
  }
});

export const AssignmentSchema = new SimpleSchema({
  group: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    index: 1
  },
  copyActionId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    index: 1,
    optional: true
  },
  start: {
    type: Date,
    label: "Beginn",
    index: 1
  },
  end: {
    type: Date,
    label: "Ende"
  },
  yearOfIsoWeek: {
    type: Number,
    index: 1,
    min: 2014,
    autoValue: function (): number {
      var context = <CustomValidatorContext>this;
      var startField = context.field("start");
      if (startField.isSet) {
        var startDate = startField.value;
        var year = Assignment.convertDateToYearOfIsoWeek(startDate);
        return year;
      } else {
        this.unset();
      }
    }
  },
  year: {
    type: Number,
    index: 1,
    min: 2015,
    autoValue: function (): number {
      var context = <CustomValidatorContext>this;
      var startField = context.field("start");
      if (startField.isSet) {
        var startDate = startField.value;
        var year = Assignment.convertDateToYear(startDate);
        return year;
      } else {
        this.unset();
      }
    }
  },
  month: {
    type: Number,
    index: 1,
    min: 0,
    max: 11,
    autoValue: function (): number {
      var context = <CustomValidatorContext>this;
      var startField = context.field("start");
      if (startField.isSet) {
        var startDate = startField.value;
        var month = Assignment.convertDateToMonthNumber(startDate);
        return month;
      } else {
        this.unset();
      }
    }
  },
  isoWeek: {
    type: Number,
    index: 1,
    min: 1,
    max: 53,
    autoValue: function (): number {
      var context = <CustomValidatorContext>this;
      var startField = context.field("start");
      if (startField.isSet) {
        var startDate = startField.value;
        var isoWeek = Assignment.convertDateToWeekNumber(startDate);
        return isoWeek;
      } else {
        this.unset();
      }
    }
  },
  state: {
    type: String,
    label: "Zustand",
    allowedValues: AssignmentStateNames,
    defaultValue: AssignmentState[AssignmentState.Online]
  },
  stateBeforeLastClose: {
    type: String,
    label: "Zustand vor letztem Schließen",
    allowedValues: AssignmentStateNames,
    optional: true
  },
  cancelationReason: {
    type: String,
    label: "Grund für Absage",
    optional: true,
    custom: function () {
      var context = <CustomValidatorContext>this;

      var shouldBeRequired = AssignmentState[<string>context.field('state').value] === AssignmentState.Canceled;

      if (shouldBeRequired) {
        // inserts
        if (!context.operator) {
          if (!context.isSet || context.value === null || context.value === "") return "required";
        }

        // updates
        else if (context.isSet) {
          if (context.operator === "$set" && context.value === null || context.value === "") return "required";
          if (context.operator === "$unset") return "required";
          if (context.operator === "$rename") return "required";
        }
      }
    }
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
  applicants: {
    type: Array,
    label: "Bewerber",
    defaultValue: []
  },
  "applicants.$": {
    type: AssignmentUserEntrySchema,
  },
  participants: {
    type: Array,
    label: "Teilnehmer",
    defaultValue: []
  },
  "participants.$": {
    type: AssignmentUserEntrySchema
  },
  contacts: {
    type: [String],
    label: "Ansprechpersonen",
    minCount: 1
  },
  "contacts.$": {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    /*        custom: function() {
                var context = <CustomValidatorContext>this;
                if (Meteor.isServer && !CollectionConf.IS_TEST && context.isSet) {
                    var groupId = <string>(context.field("group").value);
                    var group = new Group(groupId);

                    if (!group.isCoordinatorById(context.value)) {
                        return "mustBeCoordinator";
                    }
                }
            }*/
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
    }
  },
  creator: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    label: "Ersteller",
    optional: true,
    custom: function () {
      if (!CollectionConf.IS_TEST && !(this.isSet && this.value)) {
        return "required";
      }
    },
    autoValue: function () {

      if (Meteor.isServer && this.isSet) {
        return;
      }

      if (this.isInsert) {
        return Meteor.userId();
      } else if (this.isUpsert) {
        return { $setOnInsert: Meteor.userId() };
      } else {
        this.unset();
      }
    }
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

Assignments.attachSchema(AssignmentSchema);

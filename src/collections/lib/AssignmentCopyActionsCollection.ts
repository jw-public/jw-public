import SimpleSchema from "./SimpleSchema";
import { Mongo } from "meteor/mongo";

export interface UserEntry {
  user?: string;
  when?: Date;
}

export interface AssignmentCopyActionDAO {
  _id?: string;
  group?: string;
  fromIsoWeek?: number;
  fromYearOfIsoWeek?: number;
  toIsoWeek?: number;
  toYearOfIsoWeek?: number;
  totalCopied?: number;
  executedDate?: Date;
}

export const AssignmentCopyActions = new Mongo.Collection<AssignmentCopyActionDAO>(
  "assignmentCopyActions",
);

export const AssignmentCopyActionSchema = new SimpleSchema({
  group: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
  },
  fromYearOfIsoWeek: {
    type: Number,
    min: 2014,
  },
  totalCopied: {
    type: Number,
    min: 0,
  },
  toYearOfIsoWeek: {
    type: Number,
    min: 2014,
  },
  fromIsoWeek: {
    type: Number,
    min: 1,
    max: 53,
  },
  toIsoWeek: {
    type: Number,
    min: 1,
    max: 53,
  },
  executedDate: {
    type: Date,
  },
});

AssignmentCopyActions.attachSchema(AssignmentCopyActionSchema);

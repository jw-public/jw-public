import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

import { AssignmentDAO, Assignments } from "../AssignmentsCollection";

import { Counts } from "../../../lib/Counts";

import moment from "moment";

export default class AssignmentCountAccessor {
  public static ASSIGNMENT_COUNT_SUBSCRIPTION = "assignmentCount";

  /**
   * Konstruktor.
   * @param id Die ID der Gruppe.
   */
  constructor(private groupId: string) {}

  private getAvailableAssignmentsSelector(): Mongo.Selector<AssignmentDAO> {
    return {
      $and: [
        { group: this.groupId },
        {
          $or: [{ state: "Online" }, { state: "Closed" }],
        },
        {
          end: { $gte: moment().toDate() },
        },
      ],
    };
  }

  public getAssignmentsCursor(): Mongo.Cursor<AssignmentDAO> {
    return Assignments.find(this.getAvailableAssignmentsSelector(), {
      fields: { _id: 1 },
    });
  }

  public get counterName(): string {
    return "assignmentCountOfGroup_" + this.groupId;
  }

  public subscribeCount(): Meteor.SubscriptionHandle {
    return Meteor.subscribe(AssignmentCountAccessor.ASSIGNMENT_COUNT_SUBSCRIPTION, this.groupId);
  }

  public get count(): number {
    return Counts.get(this.counterName);
  }
}

import {Meteor} from "meteor/meteor";
import {Template} from "meteor/templating";
import {Session} from "meteor/session";
import {Mongo} from "meteor/mongo";
import {Blaze} from "meteor/blaze";

import {AssignmentDAO, Assignments} from "../AssignmentsCollection";

import {Counts} from "meteor/tmeasday:publish-counts";

import * as moment from "moment";

export default class AssignmentCountAccessor {

  public static ASSIGNMENT_COUNT_SUBSCRIPTION = "assignmentCount";


  /**
   * Konstruktor.
   * @param id Die ID der Gruppe.
   */
  constructor(private groupId: string) {
  }

  private getAvailableAssignmentsSelector(): Mongo.Selector {
    return {
      $and: [
        { group: this.groupId },
        {
          $or: [
            { state: "Online" },
            { state: "Closed" }
          ]
        },
        {
          end: { $gte: moment().toDate() }
        }
      ]
    };
  }

  public getAssignmentsCursor(): Mongo.Cursor<AssignmentDAO> {
    return Assignments.find(this.getAvailableAssignmentsSelector(), {
      fields: { _id: 1}
    });
  }

  public get counterName(): string {
    return "assignmentCountOfGroup_" + this.groupId;
  }

  public subscribeCount(): Meteor.SubscriptionHandle {
    return Meteor.subscribe(AssignmentCountAccessor.ASSIGNMENT_COUNT_SUBSCRIPTION, this.groupId);
  }

  public subscribeCountOnTemplate(templateInstance: Blaze.TemplateInstance): Meteor.SubscriptionHandle {
    return templateInstance.subscribe(AssignmentCountAccessor.ASSIGNMENT_COUNT_SUBSCRIPTION, this.groupId);
  }

  public get count(): number {
    return Counts.get(this.counterName);
  }

}

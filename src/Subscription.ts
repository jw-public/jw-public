import * as _ from "underscore";
import {Meteor, Subscription} from "meteor/meteor";
import {Tracker} from "meteor/tracker";

import Group from "./collections/lib/classes/Group";
import {Groups, GroupDAO} from "./collections/lib/GroupCollection";

import User from "./collections/lib/classes/User";
import * as UserCollection from "./collections/lib/UserCollection";
import * as UserNotification from "./collections/lib/classes/UserNotification";

import {GroupApplicationController} from "./collections/lib/classes/Group";


export function subscribeToApplicationCountOfAllCoordinatingGroupsOf(user: UserCollection.UserDAO) {
  let coordinatingGroups = new User(user._id).getCoordinatingGroups(true);

  subscribeToApplicationCountOfGroups(coordinatingGroups);
}

function subscribeToApplicationCountOfGroups(groups: Array<Group>) {
  _.each(groups, group => subscribeToApplicationCountOfSingleGroup(group));
}

function subscribeToApplicationCountOfSingleGroup(group: Group) {
  let groupId = group.getId();
  let applicationController = new GroupApplicationController(groupId);
  return applicationController.subscribeCount();
}

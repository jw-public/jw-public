import * as _ from "underscore";

import Group from "./collections/lib/classes/Group";

import User from "./collections/lib/classes/User";
import * as UserCollection from "./collections/lib/UserCollection";

import { GroupApplicationController } from "./collections/lib/classes/Group";


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

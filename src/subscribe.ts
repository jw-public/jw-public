import {Meteor, Subscription} from "meteor/meteor";
import {Tracker} from "meteor/tracker";


import User from "./collections/lib/classes/User";
import * as UserCollection from "./collections/lib/UserCollection";
import * as UserNotification from "./collections/lib/classes/UserNotification";

import * as SubscriptionHelper from "./Subscription";


let userDataSubscription: Meteor.SubscriptionHandle = null;


export function getUserDataSubscription(): Meteor.SubscriptionHandle {
  if (userDataSubscription === null) {
    init();
  }

  return userDataSubscription;
}

function init() {
  if (Meteor.isClient) {
    let roleSubscription = Meteor.subscribe("roles");

    Tracker.autorun(() => {
      let userDao = Meteor.user();
      userDataSubscription = Meteor.subscribe("ownUserData");

      if (userDao) {
        SubscriptionHelper.subscribeToApplicationCountOfAllCoordinatingGroupsOf(userDao);
        Meteor.subscribe("coordinatingGroups");
      }
    });
  }
}

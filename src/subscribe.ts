import { Meteor } from "meteor/meteor";
import { Tracker } from "meteor/tracker";

import * as SubscriptionHelper from "./Subscription";

let userDataSubscription: Meteor.SubscriptionHandle | null = null;

export function getUserDataSubscription(): Meteor.SubscriptionHandle {
  if (userDataSubscription === null) {
    init();
  }

  return userDataSubscription!;
}

function init() {
  if (Meteor.isClient) {
    // These app-wide subscriptions must live for the whole session. init() is
    // called lazily from getUserDataSubscription(), which is read inside React
    // components' useTracker (a Tracker computation). Without nonreactive, the
    // autorun below would be created as a CHILD of that computation and get
    // stopped on its next re-run — stopping ownUserData so its ready() flips
    // back to false forever (the dashboard's Termin cards then never render).
    // nonreactive detaches it so it becomes a top-level, session-long autorun.
    Tracker.nonreactive(() => {
      Meteor.subscribe("roles");

      Tracker.autorun(() => {
        let userDao = Meteor.user();
        userDataSubscription = Meteor.subscribe("ownUserData");

        if (userDao) {
          SubscriptionHelper.subscribeToApplicationCountOfAllCoordinatingGroupsOf(userDao);
          Meteor.subscribe("coordinatingGroups");
        }
      });
    });
  }
}

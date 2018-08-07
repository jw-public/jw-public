import {Mongo} from "meteor/mongo";
import * as UserNotification from "./classes/UserNotification";

export const Notifications = new Mongo.Collection<UserNotification.NotificationDAO>("notifications");

Notifications.attachSchema(UserNotification.NotificationSchema);

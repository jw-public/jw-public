import {Meteor} from "meteor/meteor";
import {Template} from "meteor/templating";
import {Session} from "meteor/session";
import {Mongo} from "meteor/mongo";
import {Blaze} from "meteor/blaze";
import * as moment from "moment";

import User from "../../../collections/lib/classes/User";

import * as UserNotification from "../../../collections/lib/classes/UserNotification";

import {Helper} from "../../../lib/HelperDecorator";
import {TemplateDefinition} from "../../../lib/TemplateDefinitionDecorator";

module NotificationDropdown {
  export interface ItemTemplateOptions {
    /** Ein Trennstrich wird vor dem Eintrag eingefügt */
    divider: boolean;
    /** Ein Notification Wrapper */
    notification: UserNotification.Wrapper;
  }
}

let instance = Template.instance();

Template["notificationsDropdown"].onCreated(function() {

  let instance = Template.instance();

  instance.autorun(function() {
    instance.subscribe("notifications");
  });

});

Template["notificationsDropdown"].onRendered(function() {

  $('#notificationsDropdown').on('hidden.bs.dropdown', function() {
    let user = new User(Meteor.userId());
    user.notificationManager.markAllNotificationsAsSeen();
  });
});




Template["notificationsDropdown"].helpers({

  /** Alle Notification Objekte */
  notificationItems: function(): Array<NotificationDropdown.ItemTemplateOptions> {
    let instance = Template.instance();

    if (!instance.subscriptionsReady()) {
      return null;
    }

    let user = User.current();

    let notifications: Array<UserNotification.NotificationDAO> = user.notificationManager.getAllNotifications(true).fetch();
    let items = new Array<NotificationDropdown.ItemTemplateOptions>();

    // Umbauen zu Items
    let isFirstEntry = true;
    _.forEach(notifications, function(notification) {
      items.push({
        divider: !isFirstEntry,
        notification: UserNotification.wrap(notification)
      });
      isFirstEntry = false;
    });

    return items;
  },

  hasUnreadNotifications(): boolean {
    let userId: string = Meteor.userId();
    if (_.isNull(userId)) {
      return;
    }
    let user = new User(userId);

    return user.notificationManager.hasUnreadNotifications();
  },

  unreadNotificationsCount(): number {
    let userId: string = Meteor.userId();
    if (_.isNull(userId)) {
      return;
    }
    let user = new User(userId);
    return user.notificationManager.getUnreadNotifications(true).count();
  },

  hasNotifications(): boolean {
    let userId: string = Meteor.userId();
    if (_.isNull(userId)) {
      return;
    }
    let user = new User(userId);

    // Bestimmt, ob die Anzahl der Benachrichtigungen größer als Null ist
    return user.notificationManager.getAllNotifications(true, 0).count() > 0;
  },
});



@TemplateDefinition("notificationItemContent")
class ItemContentData {

  @Helper
  static dateOfNotification(): string {
    let noficationDate: Date = ItemContentData.getNotificationDAO().when;
    return moment(noficationDate).calendar();
  }

  @Helper
  static relativeDateOfNotification(): string {
    let noficationDate: Date = ItemContentData.getNotificationDAO().when;
    return moment(noficationDate).fromNow();
  }

  private static getNotificationDAO(): UserNotification.NotificationDAO {
    return (<NotificationDropdown.ItemTemplateOptions> Template.instance().data).notification.data;
  }
}



Template["notificationsDropdown"].events({
  'click #removeAll': function(e: Event, template: Blaze.TemplateInstance) {
    e.preventDefault();
    let user = new User(Meteor.userId());

    user.notificationManager.removeAll();
  }
});

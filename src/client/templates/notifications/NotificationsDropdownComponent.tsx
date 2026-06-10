import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import moment from "moment";
import * as _ from "underscore";

import User from "../../../collections/lib/classes/User";
import * as UserNotification from "../../../collections/lib/classes/UserNotification";

interface ItemData {
  divider: boolean;
  notification: UserNotification.Wrapper;
}

function NotificationItemContent(props: { notification: UserNotification.Wrapper }): JSX.Element {
  const when = props.notification.data.when;

  return (
    <div>
      <i className={props.notification.icon}></i> {props.notification.title}
      <span className="float-end text-muted small" title={moment(when).calendar()}>
        {moment(when).fromNow()}
      </span>
      <br />
      <p className="small" style={{ whiteSpace: "pre-line" }}>
        {props.notification.details}
      </p>
    </div>
  );
}

function NotificationItem(props: ItemData): JSX.Element {
  const content = <NotificationItemContent notification={props.notification} />;

  return (
    <React.Fragment>
      {props.divider ? <li className="divider"></li> : null}
      <li className={props.notification.data.seen ? undefined : "bg-danger"}>
        {props.notification.hasLink ? <a href={props.notification.link}>{content}</a> : content}
      </li>
    </React.Fragment>
  );
}

// Rendered inside the <li class="dropdown" id="notificationsDropdown"> that
// the Blaze shell template provides (the React wrapper needs an exclusive
// parent node). The menu is shown via inline display instead of Bootstrap's
// jQuery dropdown — closing marks all notifications as seen, as before.
export default function NotificationsDropdown(): JSX.Element {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const data = useTracker(() => {
    const userId = Meteor.userId();
    if (!userId) {
      return {
        ready: false,
        items: [] as ItemData[],
        hasUnread: false,
        unreadCount: 0,
        hasNotifications: false,
      };
    }

    const handle = Meteor.subscribe("notifications");
    const user = new User(userId);

    const hasUnread = user.notificationManager.hasUnreadNotifications();
    const unreadCount = user.notificationManager.getUnreadNotifications(true).count();
    const hasNotifications = user.notificationManager.getAllNotifications(true, 0).count() > 0;

    const items: ItemData[] = [];
    if (handle.ready()) {
      const notifications = user.notificationManager.getAllNotifications(true).fetch();
      let isFirstEntry = true;
      _.forEach(notifications, (notification) => {
        items.push({ divider: !isFirstEntry, notification: UserNotification.wrap(notification) });
        isFirstEntry = false;
      });
    }

    return { ready: handle.ready(), items, hasUnread, unreadCount, hasNotifications };
  });

  // Closing the dropdown marks everything as seen (was 'hidden.bs.dropdown').
  const close = () => {
    setOpen((wasOpen) => {
      if (wasOpen) {
        new User(Meteor.userId()).notificationManager.markAllNotificationsAsSeen();
      }
      return false;
    });
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDocumentClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("click", onDocumentClick);
    return () => document.removeEventListener("click", onDocumentClick);
  }, [open]);

  const onToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (open) {
      close();
    } else {
      setOpen(true);
    }
  };

  const onRemoveAll = (e: React.MouseEvent) => {
    e.preventDefault();
    new User(Meteor.userId()).notificationManager.removeAll();
  };

  return (
    <div ref={rootRef}>
      <a
        className={`dropdown-toggle${data.hasUnread ? " dropdown-danger" : ""}`}
        href="#"
        onClick={onToggle}
      >
        <i className={`fa fa-bell fa-fw faa-ring${data.hasUnread ? " animated" : ""}`}></i>
        {data.hasUnread ? (
          <span className="badge-danger badge-notify">{data.unreadCount}</span>
        ) : null}{" "}
        <i className="fa fa-caret-down"></i>
      </a>

      <ul className="dropdown-menu dropdown-alerts" style={{ display: open ? "block" : "none" }}>
        {data.ready ? (
          <React.Fragment>
            {!data.hasNotifications ? (
              <li>
                <div>Du hast keine Benachrichtigungen.</div>
              </li>
            ) : null}
            {data.items.map((item, i) => (
              <NotificationItem key={i} divider={item.divider} notification={item.notification} />
            ))}
            <li className="divider"></li>
            <li>
              <div>
                <button
                  type="button"
                  id="removeAll"
                  className="btn btn-primary btn-sm w-100"
                  disabled={!data.hasNotifications}
                  onClick={onRemoveAll}
                >
                  <i className="fa fa-trash-o"></i> Benachrichtigungen entfernen
                </button>
              </div>
            </li>
          </React.Fragment>
        ) : (
          <li>
            <div>
              <i className="fa fa-circle-o-notch faa-spin animated"></i> Benachrichtigungen werden
              geladen...
            </div>
          </li>
        )}
      </ul>
    </div>
  );
}

import { Template } from "meteor/templating";
import NotificationsDropdown from "./NotificationsDropdownComponent";

Template["notificationsDropdown"].helpers({
  NotificationsDropdownComponent(): any {
    return NotificationsDropdown;
  }
});

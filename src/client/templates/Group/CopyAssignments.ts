import { Meteor } from "meteor/meteor";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { Template } from "meteor/templating";
import * as moment from "moment";
import * as ServerMethodsWrapper from "../../../lib/classes/ServerMethodsWrapper";

Template["copyAssignments"].helpers({
  currentIsoWeek: function () {
    return moment().isoWeek();
  }
});

Template["copyAssignments"].events({
  "submit #copy": function (event: Event) {
    event.preventDefault();

    console.log(event);
    const fromWeek = parseInt(event.target["fromWeek"].value, 10);
    const toWeek = parseInt(event.target["toWeek"].value, 10);
    const fromYear = moment().year()
    const toYear = 2023 // TODO: change after 01.01.2023
    console.log(fromWeek, toWeek, fromYear, toYear);
    let proxy = new ServerMethodsWrapper.GroupProxy(FlowRouter.getParam("groupId"));

    proxy.copyAssignmentWeek({
      from: {
        calendarWeek: fromWeek,
        year: fromYear,
      },
      to: {
        calendarWeek: toWeek,
        year: toYear,
      }
    }, function (err: Meteor.Error, totalCopied: number) {

      console.log(totalCopied);
      if (err) {
        console.error("Fehler beim kopieren:", err);
        Alerts.add("Fehler beim kopieren: " + err.reason, "danger", {});
      } else {
        Alerts.removeSeen();
        Alerts.add(`${totalCopied} Einsätze wurden von KW ${fromWeek} ${fromYear} nach KW ${toWeek} ${toYear} kopiert.`, 'success',
          {
            fadeIn: 100, fadeOut: 100, autoHide: 30000
          });
      }
    });
  }
});

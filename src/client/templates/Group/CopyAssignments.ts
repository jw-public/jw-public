import { Meteor } from "meteor/meteor";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { Template } from "meteor/templating";
import * as moment from "moment";
import * as ServerMethodsWrapper from "../../../lib/classes/ServerMethodsWrapper";

function generateWeeks(startWeek, endWeek, currentYear) {
  const weeks = [];
  for (let i = startWeek; i <= endWeek; i++) {
    const startOfWeek = moment().year(currentYear).isoWeek(i).startOf("isoWeek");
    const endOfWeek = moment().year(currentYear).isoWeek(i).endOf("isoWeek");
    const currentIsoWeek = moment().isoWeek();

    weeks.push({
      week: i,
      formattedWeek: `KW ${i} (${startOfWeek.format("DD.MM")} - ${endOfWeek.format("DD.MM")}, ${currentYear})`,
      selectedWeek: i === currentIsoWeek ? 'selected' : ''
    });
  }
  return weeks;
}

Template["copyAssignments"].helpers({
  currentIsoWeek: function () {
    return moment().isoWeek();
  },
  weeks: function () {
    const totalWeeks = moment().isoWeeksInYear();
    const currentYear = moment().year();
    return generateWeeks(1, totalWeeks, currentYear);
  },
  presentAndFutureWeeks: function () {
    const currentWeek = moment().isoWeek();
    const totalWeeks = moment().isoWeeksInYear();
    const currentYear = moment().year();
    return generateWeeks(currentWeek, totalWeeks, currentYear);
  },
});

Template["copyAssignments"].onRendered(function () {
  this.$("#toWeek").select2({
    placeholder: "Wählen Sie Kalenderwochen",
    allowClear: true,
  });
});

function selectWeeks(startWeek, endWeek) {
  const weeks = [];
  for (let i = startWeek; i <= endWeek; i++) {
    weeks.push(i);
  }
  return weeks;
}

Template["copyAssignments"].events({
  "submit #copy": function (event: Event) {
    event.preventDefault();

    const fromWeek = parseInt(event.target["fromWeek"].value, 10);
    const toWeekOptions = event.target["toWeek"].selectedOptions;
    const toWeeks = Array.from(toWeekOptions).map((option: any) => parseInt(option.value, 10));

    const fromYear = moment().year();
    const toYear = 2023; // TODO: change after 01.01.2023

    let proxy = new ServerMethodsWrapper.GroupProxy(FlowRouter.getParam("groupId"));
    let totalCopied = 0;
    let errors = "";

    const processResult = (index) => {
      if (index < toWeeks.length) {
        const toWeek = toWeeks[index];
        proxy.copyAssignmentWeek(
          {
            from: {
              calendarWeek: fromWeek,
              year: fromYear,
            },
            to: {
              calendarWeek: toWeek,
              year: toYear,
            },
          },
          function (err: Meteor.Error, copied: number) {
            if (err) {
              console.error("Fehler beim kopieren:", err);
              errors += `Fehler beim kopieren von KW ${fromWeek} ${fromYear} nach KW ${toWeek} ${toYear}: ${err.reason}\n`;
            } else {
              totalCopied += copied;
            }
            processResult(index + 1);
          }
        );
      } else {
        displaySummaryAlerts();
      }
    };

    const displaySummaryAlerts = () => {
      if (errors) {
        Alerts.add(errors, "danger", {});
      }
      if (totalCopied) {
        const message = `Aus aus KW ${fromWeek} wurden insgesamt ${totalCopied} Einsätze nach ${toWeeks.length} Wochen kopiert.`;
        Alerts.add(message, "success", {
          fadeIn: 100,
          fadeOut: 100,
          autoHide: 30000,
        });
      }
    };

    processResult(0);
  },
  "click .quick-action": function (event, template) {
    event.preventDefault();
    const timeframe = event.currentTarget.dataset.timeframe;
    const currentWeek = moment().isoWeek();
    const currentMonth = moment().month();
    const currentQuarter = moment().quarter();
    const totalWeeks = moment().isoWeeksInYear();
    let startWeek, endWeek;

    switch (timeframe) {
      case "nextMonth":
        startWeek = moment().add(1, "months").startOf("month").isoWeek();
        endWeek = moment().add(1, "months").endOf("month").isoWeek();
        break;
      case "restOfMonth":
        startWeek = currentWeek + 1;
        endWeek = moment().endOf("month").isoWeek();
        break;
      case "restOfQuarter":
        startWeek = currentWeek + 1;
        endWeek = moment().endOf("quarter").isoWeek();
        break;
      case "restOfYear":
        startWeek = currentWeek + 1;
        endWeek = totalWeeks;
        break;
    }

    const selectedWeeks = selectWeeks(startWeek, endWeek);
    template.$("#toWeek").val(selectedWeeks).trigger("change");
  },
});
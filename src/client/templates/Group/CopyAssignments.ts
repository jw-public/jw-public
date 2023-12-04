import { Meteor } from "meteor/meteor";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { Template } from "meteor/templating";
import * as moment from "moment";
import * as ServerMethodsWrapper from "../../../lib/classes/ServerMethodsWrapper";

interface Week {
  week: number;
  formattedWeek: string;
  selectedWeek: string;
  year: number;
}

function generateWeeks(startWeek: number, endWeek: number, currentYear: number): Week[] {
  const weeks = [];
  for (let i = startWeek; i <= endWeek; i++) {
    const startOfWeek = moment().year(currentYear).isoWeek(i).startOf("isoWeek");
    const endOfWeek = moment().year(currentYear).isoWeek(i).endOf("isoWeek");
    const currentIsoWeek = moment().isoWeek();

    weeks.push({
      week: i,
      formattedWeek: `KW ${i} (${startOfWeek.format("DD.MM")} - ${endOfWeek.format("DD.MM")}, ${currentYear})`,
      selectedWeek: i === currentIsoWeek ? 'selected' : '',
      year: currentYear,
    });
  }
  return weeks;
}

function generateWeeksByAmount(startWeek: number, startYear: number, amount: number): Week[] {
  // call generateWeeks with the correct parameters
  // if we go over the year, call generateWeeks again with the correct parameters
  // and concat the results

  const weeks = [];
  let currentWeek = startWeek;
  let currentYear = startYear;
  let weeksLeft = amount;

  while (weeksLeft > 0) {
    const weeksInYear = moment().year(currentYear).isoWeeksInYear();
    const weeksToGenerate = Math.min(weeksLeft, weeksInYear - currentWeek + 1);

    weeks.push(...generateWeeks(currentWeek, currentWeek + weeksToGenerate - 1, currentYear));

    currentWeek = 1;
    currentYear++;
    weeksLeft -= weeksToGenerate;
  }

  return weeks;
}


Template["copyAssignments"].helpers({
  currentIsoWeek: function () {
    return moment().isoWeek();
  },
  weeks: function () {
    const totalWeeks = moment().isoWeeksInYear() + 4; // add 4 weeks to the current year
    const currentYear = moment().year();

    return generateWeeksByAmount(1, currentYear, totalWeeks);
  },
  presentAndFutureWeeks: function () {
    const currentWeek = moment().isoWeek();
    const totalWeeks = moment().isoWeeksInYear();
    const currentYear = moment().year();
    return generateWeeksByAmount(currentWeek, currentYear, totalWeeks);
  },
});

Template["copyAssignments"].onRendered(function () {
  this.$("#toWeek").select2({
    placeholder: "Wählen Sie Kalenderwochen",
    allowClear: true,
  });
});

function selectWeeks(startWeek: number, startYear: number, endWeek: number, endYear: number): string[] {
  const weeks = [];
  let currentWeek = startWeek;
  let currentYear = startYear;

  while (currentYear < endYear || (currentYear === endYear && currentWeek <= endWeek)) {
    weeks.push(`${currentWeek}/${currentYear}`);
    currentWeek++;
    if (currentWeek > moment().year(currentYear).isoWeeksInYear()) {
      currentWeek = 1;
      currentYear++;
    }
  }

  return weeks;
}

Template["copyAssignments"].events({
  "submit #copy": function (event: Event) {
    event.preventDefault();

    const fromWeek = parseInt(event.target["fromWeek"].value, 10);
    const toWeekOptions = event.target["toWeek"].selectedOptions;
    // values are like "23/2023" (CW/Year)
    const toWeeks = Array.from(toWeekOptions).map((option: any) => {
      const [week, year] = option.value.split("/");

      const toBeReturned = {
        week: parseInt(week, 10),
        year: parseInt(year, 10),
      };

      console.log(toBeReturned);

      return toBeReturned;
    });

    const fromYear = moment().year();

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
              calendarWeek: toWeek.week,
              year: toWeek.year,
            },
          },
          function (err: Meteor.Error, copied: number) {
            if (err) {
              console.error("Fehler beim kopieren:", err);
              errors += `Fehler beim kopieren von KW ${fromWeek} ${fromYear} nach KW ${toWeek} ${toWeek.year}: ${err.reason}\n`;
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
        startWeek = moment().add(1, "months").startOf("month");
        endWeek = moment().add(1, "months").endOf("month");
        break;
      case "restOfMonth":
        startWeek = moment().add(1, "week").startOf("week");
        endWeek = moment().endOf("month");
        break;
      case "restOfQuarter":
        startWeek = moment().add(1, "week").startOf("week");
        endWeek = moment().endOf("quarter");
        break;
      case "restOfYear":
        startWeek = moment().add(1, "week").startOf("week");
        endWeek = moment().endOf("year");
        break;
    }

    const selectedWeeks = selectWeeks(startWeek.isoWeek(), startWeek.year(), endWeek.isoWeek(), endWeek.year());
    template.$("#toWeek").val(selectedWeeks).trigger("change");
  },
});
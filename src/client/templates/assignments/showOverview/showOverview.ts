
import Assignment from "../../../../collections/lib/classes/Assignment";

import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Session } from "meteor/session";
import { Mongo } from "meteor/mongo";
import { Blaze } from "meteor/blaze";
import { ReactiveVar } from "meteor/reactive-var";
import { subsCache } from "../../../lib/subscription-cache";
import { PaginatorComponent } from "../../components/paginator/paginator";

import * as moment from "moment";


import * as AccordionTemplateStorage from "../../helperModules/AccordionTemplateStorage";

import { Groups, GroupDAO } from "../../../../collections/lib/GroupCollection";
import { Assignments, AssignmentDAO } from "../../../../collections/lib/AssignmentsCollection";

import * as ServerMethodsWrapper from "../../../../lib/classes/ServerMethodsWrapper";


namespace AssignmentOverview {

  export enum FilterState {
    All, Own, ReadyForClose
  };

  export const filterStateVar = new ReactiveVar<FilterState>(FilterState.All);

  export function getProxyInstance(template: Blaze.TemplateInstance, dataContext: AssignmentPanelContext): ServerMethodsWrapper.AssignmentProxy {
    let ret = template["assignmentProxy"];
    if (!ret) {
      ret = template["assignmentProxy"] = new ServerMethodsWrapper.AssignmentProxy(dataContext.assignment._id);
    }
    return ret;
  }

  export function getSelectedMonth(): moment.Moment {
    let yearMonth = FlowRouter.getParam("yearMonth");
    let selected: moment.Moment;

    if (!yearMonth) {
      selected = moment();
    } else {
      selected = moment(yearMonth, Assignment.MonthStringFormat);
    }

    return selected;
  }

  export function getSelectedMonthYear(): string {
    return Assignment.convertDateToMonthString(getSelectedMonth());
  }

  export function getSelectedGroupId(): string {
    return FlowRouter.getParam("groupId");
  }

  export function getMonthsForPagination(monthsCount?: number): Array<moment.Moment> {
    if (!monthsCount) {
      monthsCount = 4;
    }

    let monthArray = new Array<moment.Moment>();
    for (let i = 0; i < monthsCount; i++) {
      monthArray.push(moment().add(i, 'month'));
    }
    return monthArray;
  }

  function getSelectorForAssignments(isoWeek?: number): Mongo.Selector {
    let date = getSelectedMonth();
    let selector: Mongo.Selector = {
      group: getSelectedGroupId(),
      year: date.year(),
      month: date.month(),
      end: { $gte: moment().startOf('day').toDate() }
    };


    if (filterStateVar.get() === FilterState.Own) {
      let userId = Meteor.userId();
      let selectorForOwn: Mongo.Selector =
      {
        $or: [
          {
            "applicants.user": userId
          },
          {
            "participants.user": userId
          },
        ]
      };

      selector = _.extend(selector, selectorForOwn);
    }

    if (filterStateVar.get() === FilterState.ReadyForClose) {
      let selectorReadyForClose: Mongo.Selector =
      {
        $expr: {
          $gt: ["$applicants.count", "$userGoal"]
        }
      };

      selector = _.extend(selector, selectorReadyForClose);
    }

    if (!_.isUndefined(isoWeek)) {
      let selectorForWeek: Mongo.Selector =
      {
        isoWeek: isoWeek
      };

      selector = _.extend(selector, selectorForWeek);
    }

    return selector;
  }

  export function getAssignmentCursor(isoWeek?: number): Mongo.Cursor<AssignmentDAO> {
    let selector = getSelectorForAssignments(isoWeek);
    return Assignments.find(selector, { sort: { start: 1, name: 1, _id: 1 } });
  }

  export function getIsoWeeks(): Array<{ number: number; year: number }> {
    let selector = getSelectorForAssignments();
    let isoWeekArray: Array<{ number: number; year: number }> = Assignments.find(selector, { fields: { isoWeek: 1, yearOfIsoWeek: 1 }, sort: [["start", "asc"]] }).map<{ number: number; year: number }>(function (assignment: AssignmentDAO) {
      return {
        number: assignment.isoWeek,
        year: assignment.yearOfIsoWeek
      };
    });

    return _.unique(isoWeekArray, (item, key) => item.number);
  }


  export function storeMonthYear(templateInstance: Blaze.TemplateInstance, month: string) {
    templateInstance["_month"] = month;
  }

  export function readMonthYear(templateInstance: Blaze.TemplateInstance): string {
    return templateInstance["_month"];
  }

  export interface AssignmentPanelContext {
    assignment: AssignmentDAO;
  }

}



Template["showOverview"].onCreated(function () {

  let instance = Template.instance();
  instance.autorun(function () {
    subsCache.subscribe("assignmentsInMonthPerGroup", AssignmentOverview.getSelectedGroupId(), AssignmentOverview.getSelectedMonthYear());
  });

  // must bind to `document.body` as element will be replaced during re-renders
  // add the namespace `.tplselectors` so all event handlers can be removed easily
  $(document.body).on('change.tplselectors', '#filter-all', function (e) {
    AssignmentOverview.filterStateVar.set(AssignmentOverview.FilterState.All);
  });
  // add the namespace `.tplselectors` so all event handlers can be removed easily
  $(document.body).on('change.tplselectors', '#filter-mine', function (e) {
    // handler
    AssignmentOverview.filterStateVar.set(AssignmentOverview.FilterState.Own);
  });

  $(document.body).on('change.tplselectors', '#filter-ready-for-close', function (e) {
    // handler
    AssignmentOverview.filterStateVar.set(AssignmentOverview.FilterState.ReadyForClose);
  });
});

Template["showOverview"].onRendered(function () {
  let instance = Template.instance();
  AssignmentOverview.storeMonthYear(instance, AssignmentOverview.getSelectedMonthYear());


  instance.autorun(function () {
    let oldYearMonth = AssignmentOverview.readMonthYear(instance);
    let newYearMonth = AssignmentOverview.getSelectedMonthYear();

    if (oldYearMonth !== newYearMonth) {
      // Bei Monatswechsel alle Wochen zusammenfalten
      $(".weekViewCollapse").collapse('hide');
      AssignmentOverview.storeMonthYear(instance, newYearMonth);
    }
  });



});


Template["showOverview"].destroyed = function () {
  // remove all event handlers in the namespace `.tplselectors`
  $(document.body).off('.tplselectors');
};

/**
 * ------------ Helpers ------------
 */
Template["showOverview"].helpers({
  currentFilter: function (): Object {
    let state = AssignmentOverview.filterStateVar;
    return {
      all: state.get() === AssignmentOverview.FilterState.All,
      own: state.get() === AssignmentOverview.FilterState.Own,
      readyForClose: state.get() === AssignmentOverview.FilterState.ReadyForClose,
    }
  },
  currentGroup: function (): GroupDAO {
    return Groups.findOne({ "_id": AssignmentOverview.getSelectedGroupId() });
  },
  assignments: function (): Mongo.Cursor<AssignmentDAO> {
    return AssignmentOverview.getAssignmentCursor();
  },
  isoWeeks: function (): Array<number> {
    return _.map(AssignmentOverview.getIsoWeeks(), function (isoWeek) {
      return isoWeek.number;
    });
  },
  hasAssignments: function (): boolean {
    return AssignmentOverview.getAssignmentCursor().count() > 0;
  },
  linkToDashboard: function (): string {
    return FlowRouter.path("home");
  },
  paginatorContext: function (): PaginatorComponent.PaginationContext {
    let paginationItems = Array<PaginatorComponent.PaginationItem>();
    _.forEach(AssignmentOverview.getMonthsForPagination(), function (month) {
      let monthYear: string = Assignment.convertDateToMonthString(month);
      paginationItems.push({
        link: FlowRouter.path("assignment-list", { groupId: AssignmentOverview.getSelectedGroupId(), yearMonth: monthYear }, {}),
        label: month.format("MMM YY"),
        active: monthYear == AssignmentOverview.getSelectedMonthYear()
      });
    });
    return { paginationItems: paginationItems };
  },
  weekViewContexts: function (): Array<AssignmentWeekView.TemplateContext> {
    let weekContexts = Array<AssignmentWeekView.TemplateContext>();


    _.forEach(AssignmentOverview.getIsoWeeks(), function (isoWeek, index) {
      weekContexts.push({
        isoWeek: isoWeek.number,
        year: isoWeek.year
      });
    });

    return weekContexts;
  },
});

module AssignmentWeekView {
  const KEY_RENDERED_ONCE_VAR = "_r_once";

  export interface TemplateContext {
    isoWeek: number;
    year: number;
  }

  export function createHtmlId(isoWeek: number): string {
    return "accordion_" + isoWeek;
  }





  function isRenderedOnceVarInitialised(templateInstance: Blaze.TemplateInstance): boolean {
    return !_.isUndefined(templateInstance[KEY_RENDERED_ONCE_VAR]);
  }

  function initRenderedOnceVar(templateInstance: Blaze.TemplateInstance): void {
    templateInstance[KEY_RENDERED_ONCE_VAR] = new ReactiveVar<boolean>(false);
  }

  function getRenderedOnceVar(templateInstance: Blaze.TemplateInstance): ReactiveVar<boolean> {
    if (!isRenderedOnceVarInitialised(templateInstance)) {
      initRenderedOnceVar(templateInstance);
    }

    return templateInstance[KEY_RENDERED_ONCE_VAR];
  }

  export function notifyGotRenderedOnce(templateInstance: Blaze.TemplateInstance) {
    getRenderedOnceVar(templateInstance).set(true);
  }

  export function resetGotRenderedOnce(templateInstance: Blaze.TemplateInstance) {
    getRenderedOnceVar(templateInstance).set(false);
  }

  export function isRenderedOnce(templateInstance: Blaze.TemplateInstance): boolean {
    return getRenderedOnceVar(templateInstance).get();
  }


}




Template["assignmentWeekView"].onRendered(function () {
  let instance = Template.instance();
  let context = <AssignmentWeekView.TemplateContext>instance.data;
  AssignmentWeekView.resetGotRenderedOnce(instance);
  AccordionTemplateStorage.setCollapsed(instance, true);
  AssignmentOverview.storeMonthYear(instance, AssignmentOverview.getSelectedMonthYear());


  instance.autorun(function () {

    let context = <AssignmentWeekView.TemplateContext>Template.currentData();


    let oldYearMonth = AssignmentOverview.readMonthYear(instance);
    let newYearMonth = AssignmentOverview.getSelectedMonthYear();

    if (oldYearMonth !== newYearMonth) {
      // Das Akkordion wird oben bei Monatswechsel durch ein Callback kollabiert.
      AssignmentWeekView.resetGotRenderedOnce(instance);
      AssignmentOverview.storeMonthYear(instance, newYearMonth);
    }

    $("#" + AssignmentWeekView.createHtmlId(context.isoWeek)).collapse({
      toggle: false,
      parent: "#accordion"
    }).on('hide.bs.collapse', function () {
      AccordionTemplateStorage.setCollapsed(instance, true);
    }).on('show.bs.collapse', function () {
      AccordionTemplateStorage.setCollapsed(instance, false);
    });
  });



});

Template["assignmentWeekView"].onCreated(function () {
  let instance = Template.instance();


});

Template["assignmentWeekView"].onDestroyed(function () {
  let instance = Template.instance();


});



Template["assignmentWeekView"].events({

  'click .panel-heading': function (e: Event, template: Blaze.TemplateInstance) {
    e.preventDefault();
    let instance = Template.instance();
    let context = <AssignmentWeekView.TemplateContext>Template.currentData();

    let isCollapsed = AccordionTemplateStorage.isCollapsed(instance);

    // Wenn es gerade collapsed ist, dann wird es im nächsten Schritt aufgeklappt.
    // Deswegen soll bereits der Inhalt gerendered werden.
    if (isCollapsed) {
      AssignmentWeekView.notifyGotRenderedOnce(instance);
    }

    // Erst Collapse Event auslösen, wenn die reaktiven Berechnungen durchgeführt werden.
    // Dies wird erreicht, in dem das Collapsing in einer Extra-Berechnung (oder Thread) ausgeführt wird.
    _.defer(function () {
      let action: string = (isCollapsed) ? "show" : "hide";

      $("#" + AssignmentWeekView.createHtmlId(context.isoWeek)).collapse(action);
    }, 5);


  },
});



Template["assignmentWeekView"].helpers({
  htmlId: function (): string {
    let context = <AssignmentWeekView.TemplateContext>Template.currentData();
    return AssignmentWeekView.createHtmlId(context.isoWeek);
  },
  collapsed: function (): boolean {
    return AccordionTemplateStorage.isCollapsed(Template.instance());
  },
  assignments: function (): Mongo.Cursor<AssignmentDAO> {
    let context = <AssignmentWeekView.TemplateContext>Template.currentData();
    return AssignmentOverview.getAssignmentCursor(context.isoWeek);
  },
  hasAssignments: function (): boolean {
    let context = <AssignmentWeekView.TemplateContext>Template.currentData();
    return AssignmentOverview.getAssignmentCursor(context.isoWeek).count() > 0;
  },
  render: function (): boolean {
    return AssignmentWeekView.isRenderedOnce(Template.instance());
  },
  weekHeading: function (): string {
    let context = <AssignmentWeekView.TemplateContext>Template.currentData();
    let isoWeek = moment().year(context.year).isoWeek(context.isoWeek).startOf("isoWeek");
    let month = AssignmentOverview.getSelectedMonth().startOf("month");
    let formatPattern = "Do MMMM";
    let firstDayOfIsoWeek = isoWeek.clone().startOf("isoWeek");
    let lastDayOfIsoWeek = isoWeek.clone().endOf("isoWeek");
    let firstDayOfMonth = month.clone().startOf("month");
    let lastDayOfMonth = month.clone().endOf("month");
    let firstDay: moment.Moment;
    let lastDay: moment.Moment;
    let firstDayString: string;
    let lastDayString: string;

    if (firstDayOfIsoWeek.isBefore(firstDayOfMonth)) {
      firstDay = firstDayOfMonth;
    } else {

      firstDay = firstDayOfIsoWeek;
    }

    if (lastDayOfIsoWeek.isAfter(lastDayOfMonth)) {
      lastDay = lastDayOfMonth;
    } else {
      lastDay = lastDayOfIsoWeek;
    }

    firstDayString = firstDay.format(formatPattern);
    lastDayString = lastDay.format(formatPattern);

    let ret: string;

    if (firstDay.isSame(lastDay, "day")) {
      ret = firstDayString;
    } else {
      ret = firstDayString + " bis " + lastDayString;
    }


    return ret;
  }
});

import AssignmentPanel from "./AssignmentPanel";

Template["assignmentItem"].helpers({
  AssignmentPanel(): any {
    return AssignmentPanel;
  }
});

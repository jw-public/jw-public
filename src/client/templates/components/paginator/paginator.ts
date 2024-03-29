import { Blaze } from "meteor/blaze";
import { Template } from "meteor/templating";
import * as _ from "underscore";

export module PaginatorComponent {
  export interface PaginationItem {
    active?: boolean;
    disabled?: boolean;
    onClickCallback?: (event?: Event, template?: Blaze.TemplateInstance) => void;
    link: string;
    label: string;
  }

  export interface PaginationContext {
    paginationItems: Array<PaginationItem>
  }
}

Template["paginationItem"].events({

  'click li': function (e: Event, template: Blaze.TemplateInstance) {
    var context: PaginatorComponent.PaginationItem = <PaginatorComponent.PaginationItem>Template.currentData();

    if (_.isFunction(context.onClickCallback)) {
      context.onClickCallback(event, template);
    }
  }
});

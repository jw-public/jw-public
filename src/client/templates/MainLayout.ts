import {Meteor} from "meteor/meteor";
import {Template} from "meteor/templating";
import {Session} from "meteor/session";
import {Mongo} from "meteor/mongo";
import {ReactiveVar} from "meteor/reactive-var";
import {version} from "../../Version"

  export interface Context {
      main: string;
  }


  const showBackdropVar = new ReactiveVar<boolean>(false);

  export function showBackdrop() {
    showBackdropVar.set(true);
  }

  export function hideBackdrop() {
    showBackdropVar.set(false);
  }

  export function isShowBackdrop():boolean {
    return showBackdropVar.get();
  }



Template["MainLayout"].events({
    'click .auto-scroll' : function() {
        $('body').scrollTo('#page-wrapper', {duration:'slow', offset: -50}); // Scrollt die Anzeige zum Seiten-Inhalt
    }
});

Template["MainLayout"].helpers({
    showBackdrop: function(): boolean{
        return isShowBackdrop();
    },
    version() {
        return version;
    }
});

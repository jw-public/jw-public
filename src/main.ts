import { Roles } from "meteor/alanning:roles";
import { Meteor } from "meteor/meteor";
import { Session } from "meteor/session";
import { Template } from "meteor/templating";
import ResizeSensor from "./lib/ResizeSensor";

// Es folgt der Code, der Client-Seitig im Browser ausgeführt wird.
if (Meteor.isClient) {

    // Hilfsfunktion, um festzustellen, ob ein String leer ist.
    Template.registerHelper('isEmptyString', function (value) {
        // Hilfsfunktion, die feststellt, ob ein string leer ist.
        // Diese wird im Spacebars-Template verwendet.
        return (!value || /^\s*$/.test(value));
    });


    Template.registerHelper('isAdmin', function (user) {
        return Roles.userIsInRole(user, "admin");
    });



    Meteor.startup(function () {
        Session.set('signUpErrorMessage', false);
        Session.set('signUpSuccessMessage', false);
        Session.set('loginErrorMessage', false);
        new ResizeSensor();
        $(window).bind("load resize", function () {
            var height, topOffset, width;
            topOffset = 50;
            width = (this.window.innerWidth > 0 ? this.window.innerWidth : this.screen.width);
            if (width < 768) {
                $("div.navbar-collapse").addClass("collapse");
                topOffset = 100;
            } else {
                $("div.navbar-collapse").removeClass("collapse");
            }
            height = (this.window.innerHeight > 0 ? this.window.innerHeight : this.screen.height);
            height = height - topOffset;
            if (height < 1) {
                height = 1;
            }
            if (height > topOffset) {
                $("#page-wrapper").css("min-height", height + "px");
            }
        });
    });
}

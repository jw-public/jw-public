import { Meteor } from "meteor/meteor";

// The following code runs client-side in the browser.
if (Meteor.isClient) {
    Meteor.startup(function () {
        // sb-admin layout sizing: keep #page-wrapper filling the viewport.
        $(window).bind("load resize", function () {
            var height, topOffset, width;
            topOffset = 50;
            width = (this.window.innerWidth > 0 ? this.window.innerWidth : this.screen.width);
            // Check if the width of the screen is less than 768 pixels
            if (width < 768) {
                // If it is, add the class "collapse" to the div with class "navbar-collapse"
                $("div.navbar-collapse").addClass("collapse");
                topOffset = 100;
            } else {
                // If the width of the screen is greater than or equal to 768 pixels
                // remove the class "collapse" from the div with class "navbar-collapse"
                $("div.navbar-collapse").removeClass("collapse");
            }
            height = (this.window.innerHeight > 0 ? this.window.innerHeight : this.screen.height);
            // Subtract the top offset from the height to get the final value
            height = height - topOffset;
            // Ensure that the height is not less than 1
            if (height < 1) {
                height = 1;
            }
            // Check if the height is greater than the top offset
            if (height > topOffset) {
                // If it is, set the min-height of the element with id "page-wrapper" to the calculated height
                $("#page-wrapper").css("min-height", height + "px");
            }
        });
    });
}

import { Meteor } from "meteor/meteor";

// The following code runs client-side in the browser.
if (Meteor.isClient) {
    Meteor.startup(function () {
        // sb-admin layout sizing: keep #page-wrapper filling the viewport.
        const adjustLayout = function () {
            let topOffset = 50;
            const width = window.innerWidth > 0 ? window.innerWidth : screen.width;
            const collapseTargets = document.querySelectorAll("div.navbar-collapse");
            if (width < 768) {
                collapseTargets.forEach((el) => el.classList.add("collapse"));
                topOffset = 100;
            } else {
                collapseTargets.forEach((el) => el.classList.remove("collapse"));
            }
            let height = window.innerHeight > 0 ? window.innerHeight : screen.height;
            height = height - topOffset;
            if (height < 1) {
                height = 1;
            }
            if (height > topOffset) {
                const pageWrapper = document.getElementById("page-wrapper");
                if (pageWrapper) {
                    pageWrapper.style.minHeight = height + "px";
                }
            }
        };
        window.addEventListener("load", adjustLayout);
        window.addEventListener("resize", adjustLayout);
        adjustLayout();
    });
}

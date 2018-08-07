
import {Template} from "meteor/templating";


Template["ParallaxScreen"].onRendered(function () {

    $('body').addClass('parallaxBackground');


    $(document).mousemove(function (event) {
        TweenLite.to($('body.parallaxBackground'),
            .5,
            {
                css: {
                    backgroundPosition: (event.pageX / 8) + "px " + (event.pageY / 12) + "px, " + (event.pageX / 15) + "px " + (event.pageY / 15) + "px, " + (event.pageX / 30) + "px " + (event.pageY / 30) + "px"
                }
            });
    });
});
Template["ParallaxScreen"].onDestroyed(function () {
    $('body.parallaxBackground').removeClass('parallaxBackground');
    Alerts.removeSeen();
});

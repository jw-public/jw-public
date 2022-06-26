import { Blaze } from "meteor/blaze";
import { Template } from "meteor/templating";

Template["dateRangeSelector"].onRendered(function () {

  var context = <Blaze.TemplateInstance>this;

  context.$('#dateRangeSelector').datepicker({
    todayBtn: true,
    language: "de",
    orientation: "bottom auto",
    todayHighlight: true
  }).on("changeDate", function (event) {
    console.log(event);
  });


});

/**
*
*  Diese Enumeration muss mit custom.bootstrap.import.less konsistent gehalten werden!
*
*/

// TODO: Unit-Test für Konsistenzprüfung mit der less Datei

import {Meteor} from "meteor/meteor";


export default class Color {
    constructor(public value: string) {
        /**
         * Verifiziert, ob value eine Farbe ist.
         * ^		 #start of the line
         *  #		 #  must constains a "#" symbols
         *  (		 #  start of group #1
         *   [A-Fa-f0-9]{6} #    any strings in the list, with length of 6
         *   |		 #    ..or
         *   [A-Fa-f0-9]{3} #    any strings in the list, with length of 3
         *  )		 #  end of group #1
         * $		 #end of the line
        */
        var regex: RegExp = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (value.search(regex) < 0) {
            throw new Meteor.Error("422", value + " is not a color", "Value must be a hexadecimal color.");
        }
    }

    toString(): string {
        return this.value;
    }

    // values
    static DarkSunFlower = new Color("#eab116");
    static Asbestos = new Color("#7f8c8d");


    static BrandPrimary = new Color("#4a6da7"); // Ursprünglich: #337ab7
    static BrandSuccess = new Color("#5cb85c");
    static BrandInfo = new Color("#5bc0de");
    static BrandWarning = Color.DarkSunFlower;
    static BrandDanger = new Color("#d9534f");
    static GrayLighter = new Color("#f5f5f5");
    static GrayLight = new Color("#eee");



}

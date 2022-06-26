import { Session } from "meteor/session";

export default class ResizeSensor {
    static toSense: any[];

    static initClass() {
        this.toSense = [];
    }

    static add(id) {
        ResizeSensor.toSense.push(id);
        return ResizeSensor.set(id);
    }

    static resizeEventHandler() {
        return Array.from(ResizeSensor.toSense).map((id) =>
            ResizeSensor.set(id));
    }

    static set(id) {
        return Session.set(id + '-width', $(`#${id}`).width());
    }

    constructor() {
        ResizeSensor.initClass();
        $(window).bind('resize', ResizeSensor.resizeEventHandler);
    }
}

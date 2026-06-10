import * as React from "react";
import * as ReactDOM from "react-dom";

import AssignmentPanelBody from "./AssignmentPanelBody";
import {AssignmentPanelProps} from "../AssignmentPanel";
import Assignment from "../../../../../collections/lib/classes/Assignment";

import * as moment from "moment";


export default class AssignmentPanelHeading extends React.Component<AssignmentPanelProps, {}> {

  private panelBodyHasProgressBar(): boolean {
    return AssignmentPanelBody.assignmentHasProgressBar(Assignment.createFromDAO(this.props.assignment));
  }

  public render(): JSX.Element {
    const assignmentName = this.props.assignment.name;
    const assignmentDayOfWeekShort = moment(this.props.assignment.start).format("ddd");
    const assignmentDayOfWeekLong = moment(this.props.assignment.start).format("dddd");

    let panelHeadingClassNames = "card-header";

    if (this.panelBodyHasProgressBar()) {
      panelHeadingClassNames += " with-progress-bar";
    }

    return (
      <div className={panelHeadingClassNames}>
        <div className="row">
          <div className="col-7 text-center">
            {assignmentName}
          </div>

          <div className="col-5 text-center">
            <span className="visible-lg">{assignmentDayOfWeekShort}</span>
            <span className="hidden-lg">{assignmentDayOfWeekLong}

            </span>

          </div>
        </div>
      </div>
    );
  }

}

import * as React from "react";
import moment from "moment";

import { AssignmentDAO } from "../../../../../collections/lib/AssignmentsCollection";
import { readOccupancy } from "./lib/AssignmentOccupancy";

interface PanelHeadingProps {
  assignment: AssignmentDAO;
}

export default function AssignmentPanelHeading(props: PanelHeadingProps): JSX.Element {
  const assignment = props.assignment;
  const start = moment(assignment.start);

  const classNames = readOccupancy(assignment).hasProgressBar
    ? "card-header with-progress-bar"
    : "card-header";

  return (
    <div className={classNames}>
      <div className="row">
        <div className="col-7 text-center">{assignment.name}</div>

        <div className="col-5 text-center">
          <span className="d-none d-lg-inline">{start.format("ddd")}</span>
          <span className="d-lg-none">{start.format("dddd")}</span>
        </div>
      </div>
    </div>
  );
}

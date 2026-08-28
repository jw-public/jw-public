import * as React from "react";
import { SmallProgressbar } from "../../../../react/components/SmallProgressbar/SmallProgressbar";
import DateDisplay from "../../../../react/components/DateDisplay";
import Color from "../../../../lib/Color";
import { AssignmentDAO } from "../../../../../collections/lib/AssignmentsCollection";
import { readOccupancy } from "./lib/AssignmentOccupancy";

interface PanelBodyProps {
  assignment: AssignmentDAO;
}

function ProgressBar(props: PanelBodyProps): JSX.Element | null {
  const { userGoal, totalUsers, hasProgressBar } = readOccupancy(props.assignment);

  if (!hasProgressBar) {
    return null;
  }

  let barColor = Color.Asbestos;
  if (totalUsers <= 0) {
    barColor = Color.BrandDanger;
  } else if (totalUsers >= userGoal) {
    barColor = Color.BrandSuccess;
  }

  // g-0 matches the date/time row so the body content stays flush to the
  // card edges (card-body has zero horizontal padding — see showOverview.less).
  return (
    <div className="row g-0">
      <SmallProgressbar
        value={totalUsers}
        minValue={0}
        maxValue={userGoal}
        backgroundColor={Color.GrayLighter}
        barColor={barColor}
        height="14px"
        wrapperClasses={totalUsers <= 0 ? "bar-glow-effect" : undefined}
        striped={false}
        active={false}
      />
    </div>
  );
}

export default function AssignmentPanelBody(props: PanelBodyProps): JSX.Element {
  return (
    <div className="card-body text-center assignment-item">
      <ProgressBar assignment={props.assignment} />
      <DateDisplay start={props.assignment.start} end={props.assignment.end} />
    </div>
  );
}

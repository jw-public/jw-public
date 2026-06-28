import * as React from "react";

import moment from "moment";

// Props interface for the DateDisplay component
interface DateDisplayProps {
  start: Date;
  end: Date;
}

// DateDisplay component, using the React.Component class
// and the DateDisplayProps interface as its props
export default class DateDisplay extends React.Component<DateDisplayProps, {}> {
  // Render method that returns JSX elements
  public render(): JSX.Element {
    // moment.js is used to format the start and end dates
    const start = moment(this.props.start);
    const end = moment(this.props.end);

    // Extract day of the month, month and time from the start date
    const dayOfMonth = start.format("Do");
    const month = start.format("MMM");
    const startTime = start.format("LT");
    // Extract time from the end date
    const endTime = end.format("LT");

    return (
      // g-0: no gutter so the white date cell and blue time cell tile the full
      // card width — the time cell stays flush to the right edge (no white gap).
      <div className="row g-0">
        {/* Centre the day/month in the white cell — horizontally via text-center,
            vertically (against the taller time cell) via a flex column. The old
            BS3 markup put `.row` on these, which in BS5 turns them into flex
            containers and left-aligns the date. */}
        <div className="col-7 text-center d-flex flex-column justify-content-center">
          <div className="huge">{dayOfMonth}</div>
          <div>{month}</div>
        </div>
        <div className="col-5 time text-center">
          {startTime}
          <br />
          <i className="fa fa-clock-o fa-fw"></i>
          <br />
          {endTime}
        </div>
      </div>
    );
  }
}

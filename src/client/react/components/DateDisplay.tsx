import * as React from "react";

import * as moment from "moment";

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
      <div className="row">
        <div className="col-xs-7">
          <div className="huge row">{dayOfMonth}</div>
          <div className="row">{month}</div>
        </div>
        <div className="col-xs-5 time text-center">
          {startTime}
          <br /><i className="fa fa-clock-o fa-fw"></i>
          <br />{endTime}
        </div>
      </div>
    );
  }
}

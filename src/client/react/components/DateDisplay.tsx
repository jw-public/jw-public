import * as React from "react";
import * as ReactDOM from "react-dom";

import * as moment from "moment";


interface DateDisplayProps {
  start: Date;
  end: Date;
}
export default class DateDisplay extends React.Component<DateDisplayProps, {}> {

  public render(): JSX.Element {

    const start = moment(this.props.start);
    const end = moment(this.props.end);

    const dayOfMonth = start.format("Do");
    const month = start.format("MMM");
    const startTime = start.format("LT");
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

import * as React from "react";
import * as ReactDOM from "react-dom";
import { AssignmentPanelProps } from "../AssignmentPanel";
import { SmallProgressbar } from "../../../../react/components/SmallProgressbar/SmallProgressbar";
import DateDisplay from "../../../../react/components/DateDisplay";
import Assignment from "../../../../../collections/lib/classes/Assignment";
import Color from "../../../../lib/Color";



export default class AssignmentPanelBody extends React.Component<AssignmentPanelProps, {}> {

  public static assignmentHasProgressBar(assignment: Assignment): boolean {
    let usersWanted: number = assignment.getUserGoal(true);
    return !assignment.isClosed(true) && !assignment.isCanceled(true) && usersWanted > 0;
  }

  public render(): JSX.Element {
    return (
      <div className="panel-body text-center assignment-item">
        <AssignmentPanelProgressBar assignment={this.props.assignment} />
        <DateDisplay start={this.props.assignment.start} end={this.props.assignment.end} />
      </div>
    );
  }
}


class AssignmentPanelProgressBar extends React.Component<AssignmentPanelProps, {}> {
  public get assignment(): Assignment {
    return Assignment.createFromDAO(this.props.assignment);
  }

  public hasProgressBar(): boolean {
    return AssignmentPanelBody.assignmentHasProgressBar(this.assignment);
  }

  public progressBarWrapperClasses(): string {
    let wrapperClasses: string = null;
    if (this.totalUsers <= 0) {
      wrapperClasses = "bar-glow-effect";
    }
    return wrapperClasses;
  }

  public get totalUsers(): number {
    let totalUsers: number;

    try {
      totalUsers = this.assignment.getTotalUsersCountReactive();
    } catch (error) {
      console.error(error);
      return 0;
    }
    return totalUsers;
  }

  public barColor(): Color {
    let color: Color = Color.Asbestos;
    let totalUsers = this.totalUsers;
    let usersWanted: number = this.assignment.getUserGoal(true);

    if (totalUsers <= 0) {
      color = Color.BrandDanger;
    } else if (totalUsers >= usersWanted) {
      color = Color.BrandSuccess;
    }
    return color;
  }

  public renderProgressBar(): React.ReactElement<any> {
    let assignment = this.assignment;
    let usersWanted: number = this.assignment.getUserGoal(true);


    let totalUsers = this.totalUsers;


    return (<SmallProgressbar
      value={totalUsers}
      minValue={0}
      maxValue={usersWanted}
      backgroundColor={Color.GrayLighter}
      barColor={this.barColor()}
      height="10px"
      wrapperClasses={this.progressBarWrapperClasses()}
      striped={true}
      active={true} />);

  }

  public render(): JSX.Element {

    if (!this.hasProgressBar()) {
      return null;
    }

    return (
      <div className="row">
        {this.renderProgressBar()}
      </div>
    );

  }
}



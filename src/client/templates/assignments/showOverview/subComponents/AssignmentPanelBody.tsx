import * as React from "react";
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
      <div className="card-body text-center assignment-item">
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

  public progressBarWrapperClasses(): string | null {
    let wrapperClasses: string | null = null;
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
    let usersWanted: number = this.assignment.getUserGoal(true);

    let totalUsers = this.totalUsers;

    return (
      <SmallProgressbar
        value={totalUsers}
        minValue={0}
        maxValue={usersWanted}
        backgroundColor={Color.GrayLighter}
        barColor={this.barColor()}
        height="10px"
        wrapperClasses={this.progressBarWrapperClasses() ?? undefined}
        striped={true}
        active={true}
      />
    );
  }

  public render(): JSX.Element | null {
    if (!this.hasProgressBar()) {
      return null;
    }

    // g-0 matches the date/time row so the body content stays flush to the
    // card edges (card-body has zero horizontal padding — see showOverview.less).
    return <div className="row g-0">{this.renderProgressBar()}</div>;
  }
}

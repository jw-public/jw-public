import * as React from "react";
import * as ReactDOM from "react-dom";
import AssignmentAdminButton from "./subComponents/AssignmentAdminButton";
import AssignmentPanelHeading from "./subComponents/AssignmentPanelHeading";
import AssignmentPanelBody from "./subComponents/AssignmentPanelBody";
import AssignmentPanelFooter from "./subComponents/AssignmentPanelFooter";
import { AssignmentAdminButtonProps } from "./subComponents/AssignmentAdminButton";
import { DisplayState } from "../../../../lib/classes/AssignmentDisplayStateReader";
import { AssignmentStateReader } from "../../../../lib/classes/AssignmentStateReader";
import { IAssignmentStateReader, AssignmentStateForUser } from "../../../../lib/classes/AssignmentStateReader";
import { AssignmentDisplayStateReader } from "../../../../lib/classes/AssignmentDisplayStateReader";
import { Roles } from "meteor/alanning:roles";
import { Meteor } from "meteor/meteor";
import { UserEntry, AssignmentDAO, Assignments } from "../../../../collections/lib/AssignmentsCollection";
import Group from "../../../../collections/lib/classes/Group";



export interface AssignmentPanelProps {
  assignment: AssignmentDAO;
}

export default class AssignmentPanel extends React.Component<AssignmentPanelProps, {}> {



  private renderAdminMenu(props: AssignmentAdminButtonProps): JSX.Element {
    if (!this.isEligibleToModifyAssignment()) {
      return undefined;
    }

    return <AssignmentAdminButton stateReader={props.stateReader} assignmentId={props.assignmentId} bootstrapColorClass={props.bootstrapColorClass} />;
  }

  private isEligibleToModifyAssignment(): boolean {
    return this.isAdmin() || this.isGroupCoordinator();
  }

  private isAdmin(): boolean {
    return Roles.userIsInRole(Meteor.userId(), "admin");
  }

  private isGroupCoordinator(): boolean {
    let groupId = this.props.assignment.group;
    let group = new Group(groupId);

    return group.isCoordinatorById(Meteor.userId());
  }



  public render(): JSX.Element {
    let assignment = this.props.assignment;
    let stateReader = AssignmentStateReader.fromAssignmentDAO(assignment);
    let displayStateReader = AssignmentDisplayStateReader.fromAssignmentStateReader(stateReader).withUserId(Meteor.userId());
    let colorClass = PanelConsts.getColorClassName(displayStateReader.getDisplayState());

    let adminMenu = this.renderAdminMenu({
      stateReader,
      assignmentId: assignment._id,
      bootstrapColorClass: colorClass
    });


    let panelClassNames = `panel assignment-panel panel-${colorClass}`;

    return (
      <div className="col-lg-3 col-md-6">
        <div className={panelClassNames}>
          {adminMenu}
          <AssignmentPanelHeading assignment={assignment} />
          <AssignmentPanelBody assignment={assignment} />
          <AssignmentPanelFooter assignment={assignment} state={stateReader.getAssignmentState(Meteor.userId())} displayStateReader={displayStateReader} />
        </div>
      </div>
    );
  }

}




namespace PanelConsts {
  let colorClassMap: Map<DisplayState, string> = null;

  export function getColorClassNameMap(): Map<DisplayState, string> {
    if (colorClassMap === null) {
      colorClassMap = new Map();
      colorClassMap.set(DisplayState.Closed, "closed");
      colorClassMap.set(DisplayState.UserAccepted, "accepted");
      colorClassMap.set(DisplayState.Default, "primary");
      colorClassMap.set(DisplayState.Canceled, "canceled");
      colorClassMap.set(DisplayState.UserApplicant, "applied");
    }

    return colorClassMap;
  }

  export function getColorClassName(state: DisplayState): string {
    return getColorClassNameMap().get(state);
  }
}
import * as React from "react";
import * as ReactDOM from "react-dom";
import Icon from "../../../../react/lib/Icon";
import { IAssignmentStateReader} from "../../../../../lib/classes/AssignmentStateReader";
import {Routes} from "../../../../../lib/client/routes";
import * as AssignmentManagerModal from "../../../components/assignmentManager/AssignmentManagerModal";
import * as AssignmentCancelModal from "../../../components/assignmentCancelModal/AssignmentCancelModal";

export interface AssignmentAdminButtonProps {
  bootstrapColorClass: string;
  assignmentId: string;
  stateReader: IAssignmentStateReader;
}

interface AssignmentAdminDropdownEntryProps {
  iconName: string;
  text: string;
  action: React.EventHandler<any>;
}



 class AssignmentAdminDropdownEntry extends React.Component<AssignmentAdminDropdownEntryProps, any> {


  render(): JSX.Element {
    let executeAction: React.EventHandler<React.MouseEvent<any>>;

    executeAction = (event) => {
      event.preventDefault();
      this.props.action(event);
    };

    return (
            <li>
              <a href="#" onClick={executeAction}>
                <Icon name={this.props.iconName} fixedWidth/> {this.props.text}
              </a>
            </li>);
  }

}

export default class AssignmentAdminButton extends React.Component<AssignmentAdminButtonProps, any> {

  private goToAssignmentAction(): React.EventHandler<any> {
    return () => {
      Routes.go(Routes.Def.AssignmentSingleView, {assignmentId: this.props.assignmentId});
    };
  }

  private finalizeAssignment(): React.EventHandler<any> {
    return () => {
      AssignmentManagerModal.dialog({
        assignmentId: this.props.assignmentId,
        onSuccess: function() {
        }
      });
    };
  }

  private cancelAssignment(): React.EventHandler<any> {
    return () => {
      AssignmentCancelModal.cancelDialog(this.props.assignmentId);
    };
  }

  private reenableAssignment(): React.EventHandler<any> {
    return () => {
      AssignmentCancelModal.reenableDialog(this.props.assignmentId);
    };
  }




  private renderMenuEntries(): JSX.Element[] {
    let menuEntries = this.getMenuEntryProps();

    return menuEntries.map((entry) => {
      return <AssignmentAdminDropdownEntry  iconName={entry.iconName} text={entry.text} action={entry.action}/>;
    });
  }

  private getMenuEntryProps(): AssignmentAdminDropdownEntryProps[] {
    let menuEntries: Array<AssignmentAdminDropdownEntryProps> = [
      {
        text: "Editieren",
        action: this.goToAssignmentAction(),
        iconName: "pencil",
      }, {
        text: "Abschließen",
        action: this.finalizeAssignment(),
        iconName: "users",
      }
    ];

    let cancelationManagementEntry: AssignmentAdminDropdownEntryProps = null;

    if (!this.props.stateReader.isCanceled()) {
       cancelationManagementEntry = {
          text: "Absagen",
          action: this.cancelAssignment(),
          iconName: "ban",
        };
    } else {
      cancelationManagementEntry = {
          text: "Termin stattfinden lassen",
          action: this.reenableAssignment(),
          iconName: "calendar-check-o",
        };
    }

    menuEntries.push(cancelationManagementEntry);

    return menuEntries;
  }

  render(): JSX.Element {
    let buttonClassName: string = `btn btn-xs btn-${this.props.bootstrapColorClass} dropdown-toggle`;

    return (
        <div className="zero-clipboard">
          <div className="btn-group btn-clipboard">
            <button type="button" className={buttonClassName} data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <Icon name="cog" />
              <span className="caret"></span>
            </button>
            <ul className="dropdown-menu">
              {this.renderMenuEntries()}
            </ul>
          </div>
        </div>
    );
  }
}

import * as React from "react";
import { useTracker } from "meteor/react-meteor-data";
import Icon from "../../../../react/lib/Icon";

import { AssignmentStateForUser } from "../../../../../lib/classes/AssignmentStateReader";
import { DisplayState, IAssignmentDisplayStateReader } from "../../../../../lib/classes/AssignmentDisplayStateReader";
import { AssignmentDAO } from "../../../../../collections/lib/AssignmentsCollection";

import AssignmentInteraction from "./lib/AssignmentInteraction";

interface AssignmentPanelFooterProps {

  assignment: AssignmentDAO;
  state: AssignmentStateForUser;
  displayStateReader: IAssignmentDisplayStateReader;
}


namespace PanelFooterConsts {
  let textMap: Map<DisplayState, string> = null;

  export function getColorClassName(): Map<DisplayState, string> {
    if (textMap === null) {
      textMap = new Map();
      textMap.set(DisplayState.Closed, "Termin ist geschlossen.");
      textMap.set(DisplayState.UserAccepted, "Angenommen.");
      textMap.set(DisplayState.Default, "Bewerben");
      textMap.set(DisplayState.Canceled, "Abgesagt.");
      textMap.set(DisplayState.UserApplicant, "Bewerbung zurückziehen");
    }

    return textMap;
  }

  export function getText(displayState: DisplayState): string {
    return getColorClassName().get(displayState);
  }

  let iconMap: Map<DisplayState, string> = null;

  export function getIcons(): Map<DisplayState, string> {
    if (iconMap === null) {
      iconMap = new Map();
      iconMap.set(DisplayState.Closed, "lock");
      iconMap.set(DisplayState.UserAccepted, "arrow-circle-right");
      iconMap.set(DisplayState.Default, "pencil-square-o");
      iconMap.set(DisplayState.Canceled, "calendar-times-o");
      iconMap.set(DisplayState.UserApplicant, "times");
    }

    return iconMap;
  }

  export function getIconName(displayState: DisplayState): string {
    return getIcons().get(displayState);
  }


}

export default function AssignmentPanelFooter(props: AssignmentPanelFooterProps): JSX.Element {

  const assignmentInteraction = new AssignmentInteraction(props.assignment);
  const isUpdating = useTracker(() => assignmentInteraction.requestPending, [props.assignment._id]);

  const displayState: DisplayState = props.displayStateReader.getDisplayState();

  const onClickAction = (): void => {
    switch (displayState) {
      case DisplayState.UserApplicant:
        assignmentInteraction.cancelApplication();
        break;
      case DisplayState.Default:
        assignmentInteraction.applyWithConfirmation();
        break;
      case DisplayState.Closed:
        break;
      case DisplayState.UserAccepted:
        assignmentInteraction.goToAssignment();
        break;
      case DisplayState.Canceled:
        if (props.state.isParticipant) {
          assignmentInteraction.goToAssignment();
        }
        break;
    }
  };

  const hasAction =
    displayState === DisplayState.UserApplicant ||
    displayState === DisplayState.Default ||
    displayState === DisplayState.UserAccepted ||
    (displayState === DisplayState.Canceled && props.state.isParticipant);

  const styles: React.CSSProperties = {};
  let content: JSX.Element;

  if (isUpdating) {
    styles["cursor"] = "progress";
    content = (
      <div>
        <span className="float-end"> <Icon name="spinner" pulse /></span>
        <div className="clearfix" />
      </div>
    );
  } else {
    if (hasAction) {
      styles["cursor"] = "pointer";
    }
    content = (
      <div>
        <span className="float-start">
          {PanelFooterConsts.getText(displayState)}
        </span>
        <span className="float-end"><Icon name={PanelFooterConsts.getIconName(displayState)} /></span>
        <div className="clearfix"></div>
      </div>
    );
  }

  return (
    <div className="card-footer" style={styles} onClick={hasAction ? onClickAction : undefined}>
      {content}
    </div>
  );
}

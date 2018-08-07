import * as React from "react";
import * as ReactDOM from "react-dom";
import MeteorComponent from "../../../../react/lib/MeteorComponent";
import Icon from "../../../../react/lib/Icon";
import * as reactMixin from "react-mixin";

import { IAssignmentStateReader, AssignmentStateForUser } from "../../../../../lib/classes/AssignmentStateReader";
import { DisplayState, IAssignmentDisplayStateReader } from "../../../../../lib/classes/AssignmentDisplayStateReader";
import { UserEntry, AssignmentDAO } from "../../../../../collections/lib/AssignmentsCollection";

import AssignmentInteraction from "./lib/AssignmentInteraction";

interface ReactivePanelFooterData {
  isUpdating: boolean;
}

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

@reactMixin.decorate(ReactMeteorData)
export default class AssignmentPanelFooter extends MeteorComponent<AssignmentPanelFooterProps, any, ReactivePanelFooterData> {

  private assignmentInteraction: AssignmentInteraction;



  public getMeteorData(): ReactivePanelFooterData {

    this.assignmentInteraction = new AssignmentInteraction(this.props.assignment);

    return {
      isUpdating: this.assignmentInteraction.requestPending
    };
  }

  private isUpdating(): boolean {
    return this.data.isUpdating;
  }

  private loadingAnimation(): JSX.Element {
    return (<div>
      <span className="pull-right"> <Icon name="spinner" pulse /></span>
      <div className="clearfix" />
    </div>);
  }

  private get displayState(): DisplayState {
    return this.props.displayStateReader.getDisplayState();
  }

  private get icon(): JSX.Element {


    return <Icon name={PanelFooterConsts.getIconName(this.displayState)} />;
  }

  private get text(): string {
    return PanelFooterConsts.getText(this.displayState);
  }

  private get onClickAction(): React.EventHandler<React.MouseEvent<any>> {
    switch (this.displayState) {
      case DisplayState.UserApplicant:
        return () => { this.assignmentInteraction.cancelApplication(); };
      case DisplayState.Default:
        return () => { this.assignmentInteraction.applyWithConfirmation(); };
      case DisplayState.Closed:
        return undefined;
      case DisplayState.UserAccepted:
        return () => { this.assignmentInteraction.goToAssignment(); };
      case DisplayState.Canceled:
        if (this.props.state.isParticipant) {
          return () => {
            this.assignmentInteraction.goToAssignment();
          };
        } else {
          return undefined;
        }
    }


  }


  private renderContent(): JSX.Element {
    return (<div>
      <span className="pull-left">
        {this.text}
      </span>
      <span className="pull-right">{this.icon}</span>
      <div className="clearfix"></div>
    </div>);
  }

  public render(): JSX.Element {

    let content: JSX.Element = <div />;

    let styles: React.CSSProperties = {};


    if (this.isUpdating()) {
      content = this.loadingAnimation();
      styles["cursor"] = "progress";
    } else {
      content = this.renderContent();
      if (this.hasAction()) {
        styles["cursor"] = "pointer";
      }
    }


    return (<div className="panel-footer" style={styles} onClick={this.onClickAction}>
      {content}
    </div>);
  }

  private hasAction(): boolean {
    return !_.isUndefined(this.onClickAction);
  }

}

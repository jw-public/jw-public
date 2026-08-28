import * as React from "react";
import AssignmentAdminButton from "./subComponents/AssignmentAdminButton";
import AssignmentPanelHeading from "./subComponents/AssignmentPanelHeading";
import AssignmentPanelBody from "./subComponents/AssignmentPanelBody";
import AssignmentPanelFooter from "./subComponents/AssignmentPanelFooter";
import { DisplayState } from "../../../../lib/classes/AssignmentDisplayStateReader";
import { AssignmentStateReader } from "../../../../lib/classes/AssignmentStateReader";
import { AssignmentDisplayStateReader } from "../../../../lib/classes/AssignmentDisplayStateReader";
import { Meteor } from "meteor/meteor";
import { AssignmentDAO } from "../../../../collections/lib/AssignmentsCollection";

export interface AssignmentPanelProps {
  assignment: AssignmentDAO;
  /**
   * Ob der angemeldete Benutzer diesen Termin bearbeiten darf. Kommt bewusst
   * von oben: die Prüfung (Admin-Rolle bzw. Koordinator der Gruppe) hing früher
   * an jeder einzelnen Karte und lief damit pro Termin einmal gegen Minimongo,
   * obwohl das Ergebnis für alle Karten derselben Gruppe gleich ist.
   */
  canModify: boolean;
}

const COLOR_CLASSES: Record<DisplayState, string> = {
  [DisplayState.Closed]: "closed",
  [DisplayState.UserAccepted]: "accepted",
  [DisplayState.Default]: "primary",
  [DisplayState.Canceled]: "canceled",
  [DisplayState.UserApplicant]: "applied",
};

/**
 * Eine Terminkarte in der Übersicht.
 *
 * Sämtliche Anzeigedaten stammen aus dem übergebenen DAO — `userGoal`, `state`,
 * `applicants` und `participants` liefert die Publication
 * `assignmentsInMonthPerGroup` bereits mit. Frühere Fassungen lasen dieselben
 * Felder über die `Assignment`-Hilfsklasse noch einmal aus Minimongo, teils
 * mehrfach pro Rendern; das war reine Zusatzarbeit und lief obendrein außerhalb
 * jeder Tracker-Computation, sodass die `reactive: true`-Flags wirkungslos
 * blieben.
 *
 * `memo` sorgt dafür, dass eine Änderung an einem Termin nur dessen Karte neu
 * rendert statt der gesamten Liste — was der Blaze-Vorgänger über `{{#each}}`
 * auf einem Cursor kostenlos hatte.
 */
function AssignmentPanel(props: AssignmentPanelProps): JSX.Element {
  const assignment = props.assignment;
  const userId = Meteor.userId();

  const stateReader = AssignmentStateReader.fromAssignmentDAO(assignment);
  const displayStateReader =
    AssignmentDisplayStateReader.fromAssignmentStateReader(stateReader).withUserId(userId);
  const colorClass = COLOR_CLASSES[displayStateReader.getDisplayState()];

  return (
    <div className="col-lg-3 col-md-6">
      <div className={`card assignment-panel card-${colorClass}`}>
        {props.canModify ? (
          <AssignmentAdminButton
            stateReader={stateReader}
            assignmentId={assignment._id!}
            bootstrapColorClass={colorClass}
          />
        ) : null}
        <AssignmentPanelHeading assignment={assignment} />
        <AssignmentPanelBody assignment={assignment} />
        <AssignmentPanelFooter
          assignment={assignment}
          state={stateReader.getAssignmentState(userId)}
          displayStateReader={displayStateReader}
        />
      </div>
    </div>
  );
}

export default React.memo(AssignmentPanel);

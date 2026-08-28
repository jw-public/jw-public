import { AssignmentDAO } from "../../../../../../collections/lib/AssignmentsCollection";
import { AssignmentState } from "../../../../../../collections/lib/classes/AssignmentState";

export interface AssignmentOccupancy {
  /** Gewünschte Personenzahl; 0, wenn keine Sollzahl gesetzt ist. */
  userGoal: number;
  /** Bewerber plus Teilnehmer. */
  totalUsers: number;
  /** Ein Fortschrittsbalken ergibt nur bei offenen Terminen mit Sollzahl Sinn. */
  hasProgressBar: boolean;
}

/**
 * Liest die Besetzung eines Termins aus dem DAO — ohne Minimongo-Zugriff.
 * `userGoal`, `state`, `applicants` und `participants` sind in jeder
 * Publication enthalten, die eine Terminkarte speist.
 */
export function readOccupancy(assignment: AssignmentDAO): AssignmentOccupancy {
  const userGoal = assignment.userGoal ?? 0;
  const totalUsers = (assignment.applicants?.length ?? 0) + (assignment.participants?.length ?? 0);
  const state = assignment.state;
  const isClosed = state === AssignmentState[AssignmentState.Closed];
  const isCanceled = state === AssignmentState[AssignmentState.Canceled];

  return {
    userGoal,
    totalUsers,
    hasProgressBar: !isClosed && !isCanceled && userGoal > 0,
  };
}

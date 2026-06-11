import { alertDialog, promptDialog } from "../../../react/components/dialogs";
import * as ServerMethodsWrapper from "../../../../lib/classes/ServerMethodsWrapper";

export function cancelDialog(assignmentId: string) {
  promptDialog({ title: "Was ist der Grund für die Terminabsage?" }).then(function (
    result: string | null,
  ) {
    if (result === null) {
      // Prompt dismissed
    } else {
      // result has a value
      const proxy = new ServerMethodsWrapper.AssignmentProxy(assignmentId);
      proxy.cancel(result).catch((error) => {
        console.error("Was trying to cancel an assignment: ", error);
        alertDialog("Fehler: " + error.toString(), "Fehler");
      });
    }
  });
}

export function reenableDialog(assignmentId: string) {
  promptDialog({ title: "Was ist der Grund für die Re-Aktivierung des Termins?" }).then(function (
    result: string | null,
  ) {
    if (result === null) {
      // Prompt dismissed
    } else {
      // result has a value
      const proxy = new ServerMethodsWrapper.AssignmentProxy(assignmentId);
      proxy.reenable(result).catch((error) => {
        console.error("Was trying to reenable an assignment: ", error);
        alertDialog("Fehler: " + error.toString(), "Fehler");
      });
    }
  });
}

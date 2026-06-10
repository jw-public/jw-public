import * as ServerMethodsWrapper from "../../../../lib/classes/ServerMethodsWrapper";
import { promptDialog } from "../../../react/components/dialogs";

export function cancelDialog(assignmentId: string) {
  promptDialog({ title: "Was ist der Grund für die Terminabsage?" }).then(function (
    result: string,
  ) {
    if (result === null) {
      // Prompt dismissed
    } else {
      // result has a value
      var proxy = new ServerMethodsWrapper.AssignmentProxy(assignmentId);
      proxy.cancel(result, function (error) {
        if (error) {
          console.error("Was trying to cancel an assignment: ", error);
          alert("Fehler: " + error.toString());
        }
      });
    }
  });
}

export function reenableDialog(assignmentId: string) {
  promptDialog({ title: "Was ist der Grund für die Re-Aktivierung des Termins?" }).then(function (
    result: string,
  ) {
    if (result === null) {
      // Prompt dismissed
    } else {
      // result has a value
      var proxy = new ServerMethodsWrapper.AssignmentProxy(assignmentId);
      proxy.reenable(result, function (error) {
        if (error) {
          console.error("Was trying to reenable an assignment: ", error);
          alert("Fehler: " + error.toString());
        }
      });
    }
  });
}

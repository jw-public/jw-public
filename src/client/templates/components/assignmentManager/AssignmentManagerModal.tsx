import * as _ from "underscore";
import * as React from "react";

import { contentDialog } from "../../../react/components/dialogs";
import AssignmentManagerComponent, { AssignmentManagerProps } from "./AssignmentManagerComponent";

// Kept for the e2e suite's selector (and as a stable mount hook).
const HTML_ID = "AssignmentManagerModalDialogNode";

export function dialog(templateOptions: AssignmentManagerProps, options?: { title?: string }) {
  contentDialog({
    title: options?.title ?? "Termin abschließen",
    body: (close) => (
      <div id={HTML_ID}>
        <AssignmentManagerComponent
          assignmentId={templateOptions.assignmentId}
          onSuccess={() => {
            close();
            if (
              !_.isUndefined(templateOptions.onSuccess) &&
              _.isFunction(templateOptions.onSuccess)
            ) {
              templateOptions.onSuccess();
            }
          }}
          onCancel={(event: any) => {
            close();
            if (
              !_.isUndefined(templateOptions.onCancel) &&
              _.isFunction(templateOptions.onCancel)
            ) {
              templateOptions.onCancel(event);
            }
          }}
        />
      </div>
    ),
  });
}

import * as React from "react";

// Local replacement for the global Blaze bootstrapAlerts on the migrated
// screens: same markup (alert alert-<type>), state lives in the component.

export interface InlineAlert {
  message: string;
  type: "danger" | "success" | "info" | "warning";
}

export function InlineAlerts(props: { alerts: InlineAlert[] }): JSX.Element {
  return (
    <React.Fragment>
      {props.alerts.map((a, i) => (
        <div key={i} className={`alert alert-${a.type}`}>{a.message}</div>
      ))}
    </React.Fragment>
  );
}

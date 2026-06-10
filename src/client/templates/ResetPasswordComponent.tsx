import * as React from "react";
import { useState } from "react";
import { Accounts } from "meteor/accounts-base";

import { Routes } from "../../lib/client/routes";
import { InlineAlert, InlineAlerts } from "../react/components/InlineAlerts";

export default function ResetPassword(): JSX.Element {
  const [password, setPassword] = useState("");
  const [alerts, setAlerts] = useState<InlineAlert[]>([]);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAlerts([]);

    const token = Routes.getParam(Routes.ParamNames.Token);
    console.log("trigger reset");
    Accounts.resetPassword(token, password, (err: any) => {
      if (err) {
        console.log(err);
        if (err.reason === "Token expired") {
          setAlerts([{ message: "Dein Link ist abgelaufen.", type: "danger" }]);
        } else {
          setAlerts([{ message: "Passwort ungültig. Mindestens 6 Zeichen.", type: "danger" }]);
        }
      } else {
        Routes.go(Routes.Def.Home);
      }
    });
  };

  return (
    <div className="row vertical-offset-100">
      <div className="col-md-4 offset-md-4">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Wähle neues Passwort</h3>
          </div>
          <div className="card-body">
            <InlineAlerts alerts={alerts} />
            <form acceptCharset="UTF-8" role="form" className="reset" onSubmit={onSubmit}>
              <fieldset>
                <div className="form-group">
                  <input
                    id="password"
                    className="form-control"
                    placeholder="Neues Passwort"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <input
                  id="reset"
                  className="btn btn-lg btn-success btn-block"
                  type="submit"
                  value="Zurücksetzen"
                />
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

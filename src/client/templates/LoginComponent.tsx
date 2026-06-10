import SimpleSchema from "../../collections/lib/SimpleSchema";
import * as React from "react";
import { useState } from "react";
import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";

import { Routes } from "../../lib/client/routes";
import { InlineAlert, InlineAlerts } from "../react/components/InlineAlerts";

function isEmail(value: string): boolean {
  return SimpleSchema.RegEx.Email.test(value);
}

function ForgottenPasswordModal(props: { onClose: () => void }): JSX.Element {
  const [email, setEmail] = useState("");
  const [alerts, setAlerts] = useState<InlineAlert[]>([]);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAlerts([]);
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      setAlerts([{ message: "Bitte alle Eingabefelder ausfüllen.", type: "danger" }]);
      return;
    }
    if (!isEmail(trimmed)) {
      setAlerts([{ message: "Dies ist keine gültige Email Adresse.", type: "danger" }]);
      return;
    }

    Accounts.forgotPassword({ email: trimmed }, (err: any) => {
      if (err) {
        if (err.message === "User not found [403]") {
          setAlerts([{ message: "Diese Email Adresse ist unbekannt.", type: "danger" }]);
        } else {
          console.log("Error in forgotPassword:" + err.message);
          setAlerts([{ message: "Entschuldigung, da ist was falsch gelaufen.", type: "danger" }]);
        }
      } else {
        setAlerts([
          {
            message: "Eine E-Mail wurde versendet. Bitte kontrolliere dein E-Mail Postfach.",
            type: "success",
          },
        ]);
      }
    });
  };

  return (
    <React.Fragment>
      <div className="modal fade show" style={{ display: "block" }}>
        <div className="modal-dialog">
          <div className="modal-content" id="forgottenPasswordModal">
            <div className="modal-header">
              <h4 className="modal-title">Passwort vergessen?</h4>
              <p>
                Hier kannst du an deine Emailadresse einen Link versenden lassen. Nach dem Klick auf
                diesen Link in deiner Email wirst du aufgefordert dein Passwort zu ändern.
              </p>
            </div>

            <div className="modal-body">
              <InlineAlerts alerts={alerts} />
              <form
                acceptCharset="UTF-8"
                role="form"
                className="forgotPassword"
                method="post"
                onSubmit={onSubmit}
              >
                <div className="input-group">
                  <input
                    id="email"
                    type="text"
                    name="email"
                    placeholder="Deine Email Addresse"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <span className="input-group-btn">
                    <button className="btn btn-success" type="submit">
                      <i className="fa fa-envelope"></i> Absenden
                    </button>
                  </span>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                id="close"
                className="btn btn-outline-secondary"
                onClick={props.onClose}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" onClick={props.onClose}></div>
    </React.Fragment>
  );
}

export default function Login(): JSX.Element {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [alerts, setAlerts] = useState<InlineAlert[]>([]);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const loggingIn = useTracker(() => Meteor.loggingIn(), []);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAlerts([]);

    const gotoParam = Routes.getQueryParam("goto");
    Meteor.loginWithPassword(user.trim().toLowerCase(), password, (err: any) => {
      if (err) {
        setAlerts([
          {
            message: "Benutzer oder Passwort falsch. Bitte noch einmal versuchen.",
            type: "danger",
          },
        ]);
      } else {
        if (gotoParam === undefined) {
          Routes.go(Routes.Def.Home);
        } else {
          Routes.goToPath(gotoParam);
        }
      }
    });
  };

  return (
    <div className="row vertical-offset-100">
      <div className="col-md-4 offset-md-4">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Anmeldung</h3>
          </div>
          <div className="card-body">
            {!loggingIn ? (
              <React.Fragment>
                <InlineAlerts alerts={alerts} />
                <form acceptCharset="UTF-8" role="form" className="login" onSubmit={onSubmit}>
                  <fieldset>
                    <div className="form-group">
                      <input
                        id="user"
                        className="form-control"
                        placeholder="E-mail Adresse"
                        name="user"
                        type="email"
                        value={user}
                        onChange={(e) => setUser(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <input
                        id="password"
                        className="form-control"
                        placeholder="Passwort"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <input
                      id="login"
                      className="btn btn-lg btn-success btn-block"
                      type="submit"
                      value="Login"
                    />
                  </fieldset>
                </form>
                <div className="form-actions">
                  <a
                    className="forgot_link"
                    href="/forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowForgotModal(true);
                    }}
                  >
                    Passwort vergessen?
                  </a>
                </div>
              </React.Fragment>
            ) : (
              <div className="span4 center-block text-center">
                <i className="fa fa-spinner fa-pulse fa-5x "></i>
              </div>
            )}
          </div>
        </div>
      </div>
      {showForgotModal ? (
        <ForgottenPasswordModal onClose={() => setShowForgotModal(false)} />
      ) : null}
    </div>
  );
}

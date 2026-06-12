import * as React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";

import { TERMS_OF_USE_VERSION } from "../../../imports/terms/TermsOfUse";
import { callMethod } from "../../../imports/methods/MethodContracts";
import { UserDAO } from "../../../collections/lib/UserCollection";
import { Def, buildPath } from "../../../lib/RoutePaths";
import { alertDialog } from "../../react/components/dialogs";
import { TermsOfUseContent } from "./TermsOfUseContent";

function ConsentScreen(): JSX.Element {
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);

  const onAccept = () => {
    setBusy(true);
    callMethod("acceptTermsOfUse").catch((err) => {
      setBusy(false);
      console.error(err);
      void alertDialog(
        "Die Zustimmung konnte nicht gespeichert werden. Bitte versuche es erneut.",
        "Fehler",
      );
    });
    // Kein Erfolgs-Handling nötig: das User-Dokument aktualisiert sich
    // reaktiv und das Gate gibt die App von selbst frei.
  };

  return (
    <div className="container" id="terms-consent-gate">
      <div className="row">
        <div className="col-md-8 offset-md-2" style={{ paddingTop: "30px" }}>
          <div className="card card-primary">
            <div className="card-header">
              <i className="fa fa-file-text-o"></i> Nutzungsbedingungen
            </div>
            <div className="card-body">
              <p>
                Wir haben Nutzungsbedingungen für diese Anwendung eingeführt. Damit Du den
                Trolley-Dienst weiter nutzen kannst, benötigen wir einmalig Deine Zustimmung.
              </p>
              <div
                className="terms-scroll-box"
                style={{
                  maxHeight: "320px",
                  overflowY: "auto",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  padding: "15px",
                  marginBottom: "15px",
                }}
              >
                <TermsOfUseContent />
              </div>
              <div className="form-check" style={{ marginBottom: "15px" }}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="acceptTermsCheckbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="acceptTermsCheckbox">
                  Ich habe die Nutzungsbedingungen gelesen und stimme ihnen zu.
                </label>
              </div>
              <button
                type="button"
                className="btn btn-primary accept-terms"
                disabled={!accepted || busy}
                onClick={onAccept}
              >
                <i className="fa fa-check"></i> Zustimmen und weiter
              </button>{" "}
              <Link to={buildPath(Def.Logout)} className="btn btn-outline-secondary decline-terms">
                <i className="fa fa-sign-out"></i> Ablehnen und abmelden
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner(): JSX.Element {
  return (
    <div className="text-center" style={{ paddingTop: "100px" }}>
      <i className="fa fa-spinner fa-pulse fa-5x"></i>
    </div>
  );
}

/**
 * Blockierendes Consent-Gate für eingeloggte Nutzer: Konten ohne Zustimmung
 * zur AKTUELLEN Version der Nutzungsbedingungen (Bestandskonten von vor der
 * Einführung oder nach einer Versionserhöhung) sehen statt der App eine
 * Zustimmungsseite. Sitzt innerhalb von RequireLogin — Authentifizierung ist
 * hier bereits geklärt.
 */
export default function RequireTermsConsent(props: { children: JSX.Element }): JSX.Element {
  const decision = useTracker(() => {
    const userId = Meteor.userId();
    if (!userId) {
      // Auth-Zustände behandelt RequireLogin; hier nicht doppelt blocken.
      return "render";
    }
    // Meteors eingebaute null-Publikation liefert das eigene Dokument ohne
    // termsOfUse — erst die ownUserData-Subscription macht den Consent-Status
    // sichtbar. Vorher nicht entscheiden (sonst flackert das Gate).
    const subscription = Meteor.subscribe("ownUserData");
    if (!subscription.ready()) {
      return "wait";
    }
    const user = Meteor.users.findOne(userId) as UserDAO | undefined;
    return user?.termsOfUse?.version === TERMS_OF_USE_VERSION ? "render" : "consent";
  }, []);

  switch (decision) {
    case "render":
      return props.children;
    case "consent":
      return <ConsentScreen />;
    default:
      return <LoadingSpinner />;
  }
}

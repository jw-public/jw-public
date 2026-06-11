import { alertDialog } from "../../react/components/dialogs";
import SimpleSchema from "../../../collections/lib/SimpleSchema";
import * as React from "react";
import { useState } from "react";
import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { Routes } from "../../../lib/client/routes";

import { Groups } from "../../../collections/lib/GroupCollection";
import * as Registration from "../../../collections/lib/Registration";
import { InlineAlert, InlineAlerts } from "../../react/components/InlineAlerts";

const GENDER_OPTIONS = [
  { label: "ein Bruder", value: "Male" },
  { label: "eine Schwester", value: "Female" },
];

function BooleanSelect(props: {
  name: string;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}): JSX.Element {
  return (
    <div className="form-group">
      <label>{props.label}</label>
      <select
        name={props.name}
        className="form-control"
        value={props.value ? "true" : "false"}
        onChange={(e) => props.onChange(e.target.value === "true")}
      >
        <option value="true">Ja</option>
        <option value="false">Nein</option>
      </select>
    </div>
  );
}

export default function RegisterInGroup(): JSX.Element {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("Male");
  const [carMostlyAvailable, setCarMostlyAvailable] = useState(true);
  const [pioneer, setPioneer] = useState(false);
  const [mobile, setMobile] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [zip, setZip] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [alerts, setAlerts] = useState<InlineAlert[]>([]);

  const groupName = useTracker(() => {
    const groupId = Routes.getParam("groupId");
    Meteor.subscribe("groupName", groupId);
    return Groups.findOne({ _id: groupId })?.name ?? "";
  });

  const onSubmitStepOne = (event: React.FormEvent) => {
    event.preventDefault();
    setAlerts([]);
    const cleaned = email.trim().toLowerCase();

    if (!SimpleSchema.RegEx.Email.test(cleaned)) {
      setAlerts([{ message: "Dies ist keine gültige Email Adresse.", type: "danger" }]);
      return;
    }

    Meteor.callAsync("userExists", cleaned).then((userExists: boolean) => {
      if (userExists) {
        console.log("Benutzer ist bereits registriert!");
        alertDialog(
          "Du bist bereits schon im System registriert. Eine zweite Registrierung ist zurzeit nicht möglich.",
        );
      } else {
        console.log("Benutzer ist neu! Weiter gehts.");
        setEmail(cleaned);
        setStep(2);
      }
    });
  };

  const onSubmitStepTwo = (event: React.FormEvent) => {
    event.preventDefault();
    setAlerts([]);

    const doc: Registration.INewUser = {
      email,
      password,
      passwordConfirmation,
      profile: {
        first_name: firstName,
        last_name: lastName,
        gender,
        carMostlyAvailable,
        pioneer,
        mobile,
        placeName,
        zip,
        pendingGroups: [Routes.getParam("groupId")],
      } as any,
    };

    // Same validation source as the old AutoForm: the SimpleSchema context.
    Registration.NewUserSchema.clean(doc, { mutate: true });
    const context = Registration.getStepTwoContext();
    const valid = context.validate(doc, {});
    if (!valid) {
      const messages = context.validationErrors().map((k: any) => context.keyErrorMessage(k.name));
      setAlerts(messages.map((message: string) => ({ message, type: "danger" as const })));
      return;
    }

    Accounts.createUser(
      { email: doc.email, password: doc.password, profile: doc.profile },
      (err: any) => {
        if (err) {
          alertDialog(err.details ?? err.reason ?? String(err), "Fehler");
          console.error(err);
        } else {
          Routes.go(Routes.Def.Home);
        }
      },
    );
  };

  return (
    <div>
      <div className="row">
        <div className="col-md-8 offset-md-2">
          <div className="card card-primary">
            <div className="card-body">
              <h1 className="page-header">Registrierung für {groupName}</h1>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-3 offset-md-2">
          <div className="card card-primary">
            {step === 1 ? (
              <React.Fragment>
                <div className="card-header">
                  <i className="fa fa-home"></i> Willkommen!
                </div>
                <div className="card-body">
                  <p>
                    Hier kannst Du Dich für den Trolleydienst in der Gruppe {groupName} anmelden.
                  </p>
                  <p>Gib bitte Deine E-Mail Adresse ein und klicke dann auf weiter.</p>
                </div>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <div className="card-header">
                  <i className="fa fa-user-plus"></i> Nur noch ein Schritt!
                </div>
                <div className="card-body">
                  <p>Wir würden noch gerne wissen, wer Du bist.</p>
                  <p>
                    Es hilft uns sehr bei der Organisation, wenn wir deine Kontaktdaten haben und
                    diese für den Zweck der Organisation unserer Öffentlichkeitsarbeit verwenden
                    dürfen.
                  </p>
                </div>
              </React.Fragment>
            )}
          </div>
        </div>
        <div className="col-md-5">
          <div className="card card-primary">
            {step === 1 ? (
              <React.Fragment>
                <div className="card-header">
                  <i className="fa fa-envelope"></i> Meine E-Mail Adresse
                </div>
                <div className="card-body">
                  <InlineAlerts alerts={alerts} />
                  <form onSubmit={onSubmitStepOne}>
                    <fieldset>
                      <div className="form-group">
                        <input
                          type="email"
                          name="email"
                          className="form-control"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <button type="submit" className="btn btn-primary next-button-registration">
                          Weiter <i className="fa fa-arrow-right"></i>
                        </button>
                      </div>
                    </fieldset>
                  </form>
                </div>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <div className="card-header">
                  <i className="fa fa-table"></i> Meine Daten
                </div>
                <div className="card-body">
                  <InlineAlerts alerts={alerts} />
                  <form onSubmit={onSubmitStepTwo}>
                    <fieldset>
                      <div className="form-group">
                        <label>Meine E-Mail Adresse</label>
                        <input
                          type="email"
                          name="email"
                          className="form-control"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Vorname</label>
                        <input
                          type="text"
                          name="profile.first_name"
                          className="form-control"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Nachname</label>
                        <input
                          type="text"
                          name="profile.last_name"
                          className="form-control"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Ich bin</label>
                        <div>
                          {GENDER_OPTIONS.map((o) => (
                            <label key={o.value} className="radio-inline">
                              <input
                                type="radio"
                                name="profile.gender"
                                value={o.value}
                                checked={gender === o.value}
                                onChange={() => setGender(o.value)}
                              />{" "}
                              {o.label}
                            </label>
                          ))}
                        </div>
                      </div>
                      <BooleanSelect
                        name="profile.carMostlyAvailable"
                        label="Meistens habe ich ein Auto zur Verfügung"
                        value={carMostlyAvailable}
                        onChange={setCarMostlyAvailable}
                      />
                      <BooleanSelect
                        name="profile.pioneer"
                        label="Ich bin ein Pionier"
                        value={pioneer}
                        onChange={setPioneer}
                      />
                      <div className="form-group">
                        <label>
                          Handynummer (Für Österreich bitte die führende 0 mit +43 ersetzen)
                        </label>
                        <input
                          type="text"
                          name="profile.mobile"
                          className="form-control"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Wohnort</label>
                        <input
                          type="text"
                          name="profile.placeName"
                          className="form-control"
                          value={placeName}
                          onChange={(e) => setPlaceName(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Postleitzahl</label>
                        <input
                          type="text"
                          name="profile.zip"
                          className="form-control"
                          value={zip}
                          onChange={(e) => setZip(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Denk dir ein Passwort aus</label>
                        <input
                          type="password"
                          name="password"
                          className="form-control"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Tipp dein neues Passwort noch einmal ein</label>
                        <input
                          type="password"
                          name="passwordConfirmation"
                          className="form-control"
                          value={passwordConfirmation}
                          onChange={(e) => setPasswordConfirmation(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <button type="submit" className="btn btn-primary submit-change">
                          <i className="fa fa-sign-in"></i> Anmelden
                        </button>{" "}
                        <a
                          href=""
                          id="backToStart"
                          className="btn btn-outline-secondary"
                          onClick={(e) => {
                            e.preventDefault();
                            setAlerts([]);
                            setStep(1);
                          }}
                        >
                          <i className="fa fa-arrow-left"></i> Zurück
                        </a>
                      </div>
                    </fieldset>
                  </form>
                </div>
              </React.Fragment>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

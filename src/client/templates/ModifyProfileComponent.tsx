import { alertDialog, confirmDialog } from "../react/components/dialogs";
import * as React from "react";
import { useState } from "react";
import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";

import User from "../../collections/lib/classes/User";
import * as UserCollection from "../../collections/lib/UserCollection";
import { callMethod } from "../../imports/methods/MethodContracts";
import { InlineAlert, InlineAlerts } from "../react/components/InlineAlerts";

const GENDER_OPTIONS = [
  { label: "ein Bruder", value: "Male" },
  { label: "eine Schwester", value: "Female" },
];

const LANGUAGE_OPTIONS = [
  { value: "de-de", label: "Deutsch" },
  { value: "en-en", label: "Englisch" },
  { value: "fr-fr", label: "Französisch" },
];

function BooleanSelect(props: {
  id: string;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}): JSX.Element {
  return (
    <div className="form-group">
      <label htmlFor={props.id}>{props.label}</label>
      <select
        id={props.id}
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

function ProfileDataForm(props: { user: Meteor.User }): JSX.Element {
  const profile = props.user.profile as UserCollection.UserProfile;
  const [firstName, setFirstName] = useState(profile.first_name ?? "");
  const [lastName, setLastName] = useState(profile.last_name ?? "");
  const [gender, setGender] = useState(profile.gender ?? "Male");
  const [carMostlyAvailable, setCarMostlyAvailable] = useState(profile.carMostlyAvailable ?? true);
  const [pioneer, setPioneer] = useState(profile.pioneer ?? false);
  const [mobile, setMobile] = useState(profile.mobile ?? "");
  const [placeName, setPlaceName] = useState(profile.placeName ?? "");
  const [zip, setZip] = useState(profile.zip ?? "");
  const [alerts, setAlerts] = useState<InlineAlert[]>([]);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAlerts([]);

    UserCollection.users.update(
      props.user._id,
      {
        $set: {
          "profile.first_name": firstName,
          "profile.last_name": lastName,
          "profile.gender": gender,
          "profile.carMostlyAvailable": carMostlyAvailable,
          "profile.pioneer": pioneer,
          "profile.mobile": mobile,
          "profile.placeName": placeName,
          "profile.zip": zip,
        },
      },
      {},
      (err: any) => {
        if (err) {
          console.log("Fehler beim Speichern des Profils: ", err);
          setAlerts([
            { message: "Speichern fehlgeschlagen: " + (err.reason ?? err.message), type: "danger" },
          ]);
        } else {
          setAlerts([{ message: "Dein Profil wurde gespeichert.", type: "success" }]);
        }
      },
    );
  };

  return (
    <form onSubmit={onSubmit}>
      <fieldset>
        <InlineAlerts alerts={alerts} />
        <div className="form-group">
          <label>Anmeldeadresse</label>
          <input
            type="text"
            className="form-control"
            value={(props.user.emails?.[0] as any)?.address ?? ""}
            disabled
          />
        </div>
        <div className="form-group">
          <label htmlFor="profile-first-name">Vorname</label>
          <input
            id="profile-first-name"
            name="profile.first_name"
            type="text"
            className="form-control"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="profile-last-name">Nachname</label>
          <input
            id="profile-last-name"
            name="profile.last_name"
            type="text"
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
          id="profile-car"
          label="Meistens habe ich ein Auto zur Verfügung"
          value={carMostlyAvailable}
          onChange={setCarMostlyAvailable}
        />
        <BooleanSelect
          id="profile-pioneer"
          label="Ich bin ein Pionier"
          value={pioneer}
          onChange={setPioneer}
        />
        <div className="form-group">
          <label htmlFor="profile-mobile">
            Handynummer (Hier kann ausnahmsweise auch die Festnetznummer eingetragen werden falls du
            kein Handy besitzt)
          </label>
          <input
            id="profile-mobile"
            name="profile.mobile"
            type="text"
            className="form-control"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="profile-place">Wohnort</label>
          <input
            id="profile-place"
            name="profile.placeName"
            type="text"
            className="form-control"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="profile-zip">Postleitzahl</label>
          <input
            id="profile-zip"
            name="profile.zip"
            type="text"
            className="form-control"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
          />
        </div>
        <div className="form-group">
          <button type="submit" className="btn btn-primary submit-change">
            <i className="fa fa-floppy-o"></i> Speichern
          </button>
        </div>
      </fieldset>
    </form>
  );
}

// Kalender-Abo (iCal): zeigt den persönlichen Feed-Link an. Der Token wird
// erst auf Klick per Methode erzeugt/geholt — er ist bewusst nicht publiziert.
function CalendarSubscriptionCard(): JSX.Element {
  const [feedUrl, setFeedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const urlForToken = (token: string) => `${window.location.origin}/api/calendar/${token}.ics`;

  const showLink = () => {
    callMethod("getCalendarToken")
      .then((token) => setFeedUrl(urlForToken(token)))
      .catch((err) => {
        console.error(err);
        void alertDialog("Der Kalender-Link konnte nicht erzeugt werden.", "Fehler");
      });
  };

  const resetLink = () => {
    void confirmDialog({
      title: "Kalender-Link erneuern",
      message:
        "Der bisherige Kalender-Link wird ungültig — bestehende Abos in deinen " +
        "Kalender-Apps musst du danach neu einrichten. Fortfahren?",
      yesVariant: "danger",
    }).then((yes) => {
      if (!yes) {
        return;
      }
      callMethod("resetCalendarToken")
        .then((token) => {
          setFeedUrl(urlForToken(token));
          setCopied(false);
        })
        .catch((err) => {
          console.error(err);
          void alertDialog("Der Kalender-Link konnte nicht erneuert werden.", "Fehler");
        });
    });
  };

  const copyLink = () => {
    if (!feedUrl) {
      return;
    }
    void navigator.clipboard
      .writeText(feedUrl)
      .then(() => setCopied(true))
      .catch(() => setCopied(false));
  };

  return (
    <div className="card card-primary">
      <div className="card-header">
        <i className="fa fa-calendar fa-fw"></i> Kalender-Abo (iCal)
      </div>
      <div className="card-body">
        <p className="small">
          Abonniere deine Termine in deiner Kalender-App (Google, Apple, Outlook …). Neue
          Teilnahmen, Bewerbungen und Absagen erscheinen dort automatisch. Behandle den Link wie ein
          Passwort — jeder, der ihn kennt, kann deine Termine sehen.
        </p>
        {feedUrl ? (
          <div>
            <div className="form-group">
              <input
                id="calendarFeedUrl"
                type="text"
                className="form-control"
                readOnly
                value={feedUrl}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <button type="button" className="btn btn-primary copy-calendar-url" onClick={copyLink}>
              <i className="fa fa-clipboard"></i> {copied ? "Kopiert!" : "Link kopieren"}
            </button>{" "}
            <button
              type="button"
              className="btn btn-outline-danger reset-calendar-url"
              onClick={resetLink}
            >
              <i className="fa fa-refresh"></i> Link erneuern
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-primary show-calendar-url" onClick={showLink}>
            <i className="fa fa-link"></i> Kalender-Link anzeigen
          </button>
        )}
      </div>
    </div>
  );
}

// Self-Service für Koordinatoren: bei welchen voll gewordenen Terminen der
// eigenen Gruppen benachrichtigt werden soll.
function FullNotifySettings(props: {
  profile: UserCollection.UserProfile;
  setProfileField: (field: string, value: any) => void;
}): JSX.Element {
  const mode = props.profile.fullNotifyMode ?? "all";
  const days = props.profile.fullNotifyDays ?? 7;

  return (
    <div style={{ marginTop: "10px" }}>
      <div className="form-group">
        <label htmlFor="fullNotifyMode">
          Wenn ein Termin meiner Gruppen voll wird und Bewerber zu bestätigen sind
        </label>
        <select
          id="fullNotifyMode"
          className="form-control"
          value={mode}
          onChange={(e) => props.setProfileField("profile.fullNotifyMode", e.target.value)}
        >
          <option value="all">Immer benachrichtigen</option>
          <option value="nearOnly">Nur wenn der Termin bald stattfindet</option>
          <option value="none">Nie benachrichtigen</option>
        </select>
      </div>
      {mode === "nearOnly" ? (
        <div className="form-group">
          <label htmlFor="fullNotifyDays">Nur wenn der Termin beginnt in (Tagen)</label>
          <input
            id="fullNotifyDays"
            type="number"
            className="form-control"
            min={1}
            max={60}
            value={days}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (Number.isFinite(value) && value >= 1 && value <= 60) {
                props.setProfileField("profile.fullNotifyDays", value);
              }
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function ChangePasswordForm(): JSX.Element {
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [alerts, setAlerts] = useState<InlineAlert[]>([]);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAlerts([]);

    if (oldPassword.length < 6 || password.length < 6) {
      setAlerts([{ message: "Dein Passwort muss mindesten 6 Zeichen lang sein.", type: "danger" }]);
      return;
    }
    if (password !== confirmation) {
      setAlerts([{ message: "Deine zwei Passwörter sind nicht identisch.", type: "danger" }]);
      return;
    }

    void Accounts.changePassword(oldPassword, password, (err: any) => {
      if (err) {
        console.log("Fehler: ", err);
        const errorMessage =
          err.reason === "Incorrect password"
            ? "Kennwort konnte nicht geändert werden: Das alte Passwort ist falsch."
            : "Ein Fehler ist aufgetreten: " + err.message;
        setAlerts([{ message: errorMessage, type: "danger" }]);
      } else {
        console.log("Dein Kennwort wurde geändert!");
        setAlerts([{ message: "Dein Kennwort wurde erfolgreich geändert.", type: "success" }]);
        setOldPassword("");
        setPassword("");
        setConfirmation("");
      }
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <fieldset>
        <InlineAlerts alerts={alerts} />
        <div className="form-group">
          <label htmlFor="oldpassword">Altes Passwort</label>
          <input
            id="oldpassword"
            name="oldpassword"
            type="password"
            className="form-control"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="newpassword">Passwort</label>
          <input
            id="newpassword"
            name="password"
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="passwordConfirmation">Passwort bestätigen</label>
          <input
            id="passwordConfirmation"
            name="passwordConfirmation"
            type="password"
            className="form-control"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </div>
        <div className="form-group">
          <button type="submit" className="btn btn-primary submit-change">
            <i className="fa fa-sign-in"></i> Ändern
          </button>
        </div>
      </fieldset>
    </form>
  );
}

export default function ModifyProfile(): JSX.Element {
  const user = useTracker(() => Meteor.user());
  // Die Bewerbungs-Benachrichtigung betrifft nur Koordinatoren — für alle
  // anderen bleibt die Karte unverändert schlank.
  const isCoordinator = useTracker(() => {
    Meteor.subscribe("coordinatingGroups");
    const userId = Meteor.userId();
    if (!userId) {
      return false;
    }
    const current = new User(userId);
    return current.exists() ? current.isCoordinatorInAnyGroup(true) : false;
  });

  if (!user) {
    return <div />;
  }

  const profile = user.profile as UserCollection.UserProfile;

  // Autosave settings (the old AutoForms used autosave=true here).
  const setProfileField = (field: string, value: any) => {
    UserCollection.users.update(user._id, { $set: { [field]: value } }, {}, (err: any) => {
      if (err) {
        console.log(`Fehler beim Speichern von ${field}: `, err);
        void alertDialog("Speichern fehlgeschlagen: " + (err.reason ?? err.message), "Fehler");
      }
    });
  };

  return (
    <div>
      <div className="row">
        <div className="col-lg-12">
          <h1 className="page-header">Profil</h1>
          {profile.first_name ? (
            <p>
              Hallo {profile.first_name}
              {profile.last_name ? ` ${profile.last_name}` : ""}, hier kannst du dein Benutzerprofil
              einstellen.
            </p>
          ) : null}
        </div>
      </div>
      <div className="row">
        <div className="col-md-5">
          <div className="card card-primary">
            <div className="card-header">Daten ändern</div>
            <div className="card-body">
              {/* key: remount when another user logs in */}
              <ProfileDataForm key={user._id} user={user} />
            </div>
          </div>
        </div>
        <div className="col-md-5">
          <div className="card card-primary">
            <div className="card-header">Benachrichtigungen</div>
            <div className="card-body">
              <div className="checkbox">
                <label>
                  <input
                    type="checkbox"
                    name="profile.notificationAsEmail"
                    checked={profile.notificationAsEmail ?? true}
                    onChange={(e) =>
                      setProfileField("profile.notificationAsEmail", e.target.checked)
                    }
                  />{" "}
                  Benachrichtigungen via E-Mail bekommen
                </label>
              </div>
              {isCoordinator ? (
                <FullNotifySettings profile={profile} setProfileField={setProfileField} />
              ) : null}
            </div>
          </div>
          <CalendarSubscriptionCard />
          <div className="card card-primary">
            <div className="card-header">Sprache für E-Mail-Benachrichtigungen</div>
            <div className="card-body">
              <div className="form-group">
                <label htmlFor="profile-language">Sprache</label>
                <select
                  id="profile-language"
                  className="form-control"
                  value={profile.language ?? "de-de"}
                  onChange={(e) => setProfileField("profile.language", e.target.value)}
                >
                  {LANGUAGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="card card-primary">
            <div className="card-header">Passwort ändern</div>
            <div className="card-body">
              <ChangePasswordForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

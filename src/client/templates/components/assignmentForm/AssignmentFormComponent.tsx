import * as React from "react";
import { useMemo, useState } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import * as moment from "moment";

import DatePicker, { registerLocale } from "react-datepicker";
import { de } from "date-fns/locale";

import { AssignmentDAO, Assignments } from "../../../../collections/lib/AssignmentsCollection";
import { AssignmentState } from "../../../../collections/lib/classes/AssignmentState";
import Group from "../../../../collections/lib/classes/Group";
import User from "../../../../collections/lib/classes/User";

import { InlineAlert, InlineAlerts } from "../../../react/components/InlineAlerts";
import MultiSelect from "../../../react/components/MultiSelect";

import "react-datepicker/dist/react-datepicker.css";

registerLocale("de", de);

// Props mirror the old Blaze TemplateOptions of the assignmentForm template.
export interface AssignmentFormProps {
  formType: "insert" | "update";
  doc?: AssignmentDAO;
  resetOnSuccess?: boolean;
  submitButtonText: string;
  headingText: string;
  currentGroupId: string;
  fontAwesomeLogo: string;
  panelClass: string;
  buttonClass: string;
  onSuccess?: () => void;
}

const DEFAULT_DURATION_MINUTES = 2 * 60;
const DURATION_BOUNDS = { lower: 15, upper: 8 * 60 };

function defaultStartDate(): Date {
  return moment().add(1, "days").hour(12).minutes(0).seconds(0).milliseconds(0).toDate();
}

function durationOf(doc: AssignmentDAO): number {
  return Math.round(moment.duration(moment(doc.end).diff(moment(doc.start))).asMinutes());
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours} Stunden, ${rest} Minuten`;
}

function formatDurationShort(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours} Std., ${rest} Min.`;
}

export default function AssignmentForm(props: AssignmentFormProps): JSX.Element {
  const [start, setStart] = useState<Date>(props.doc ? new Date(props.doc.start as any) : defaultStartDate());
  const [duration, setDuration] = useState<number>(props.doc ? durationOf(props.doc) : DEFAULT_DURATION_MINUTES);
  const [name, setName] = useState(props.doc?.name ?? "");
  const [state, setState] = useState(props.doc?.state ?? "Online");
  const [userGoal, setUserGoal] = useState(String(props.doc?.userGoal ?? 0));
  const [pickupPoint, setPickupPoint] = useState(props.doc?.pickup_point ?? "");
  const [returnPoint, setReturnPoint] = useState(props.doc?.return_point ?? "");
  const [contacts, setContacts] = useState<string[]>(props.doc?.contacts ?? []);
  const [note, setNote] = useState(props.doc?.note ?? "");
  const [alerts, setAlerts] = useState<InlineAlert[]>([]);

  const contactOptions = useTracker(() => {
    Meteor.subscribe("singleGroup", props.currentGroupId);
    Meteor.subscribe("groupCoordinators", props.currentGroupId);

    const group = new Group(props.currentGroupId);
    return Meteor.users
      .find(
        { _id: { $in: group.getCoordinatorIds() } },
        { fields: { "profile.first_name": 1, "profile.last_name": 1 } },
      )
      .map((c: Meteor.User) => ({ label: User.createFromDAO(c as any).fullName, value: c._id }));
  }, [props.currentGroupId]);

  const end = useMemo(() => moment(start).add(duration, "minutes").toDate(), [start, duration]);

  const isCanceled = props.doc != null && AssignmentState[props.doc.state] === AssignmentState.Canceled;

  const increaseDuration = (minutes: number) => {
    setDuration((d) => Math.min(DURATION_BOUNDS.upper, Math.max(DURATION_BOUNDS.lower, d + minutes)));
  };

  const reset = () => {
    setStart(defaultStartDate());
    setDuration(DEFAULT_DURATION_MINUTES);
    setName("");
    setState("Online");
    setUserGoal("0");
    setPickupPoint("");
    setReturnPoint("");
    setContacts([]);
    setNote("");
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAlerts([]);

    const fields = {
      group: props.currentGroupId,
      start,
      end,
      name,
      state,
      userGoal: Number(userGoal),
      pickup_point: pickupPoint || undefined,
      return_point: returnPoint || undefined,
      contacts,
      note: note || undefined,
    };

    // Validation happens in collection2 during insert/update — the same path
    // AutoForm used (autoValues like creator/createdAt are applied there).
    // On failure the collection's validation context carries the German
    // per-field messages from Errors.ts.
    const callback = (err: any) => {
      if (err) {
        const context = (Assignments as any).simpleSchema().namedContext();
        const invalidKeys = context.invalidKeys ? context.invalidKeys() : [];
        if (invalidKeys.length > 0) {
          setAlerts(
            invalidKeys.map((k: any) => ({
              message: context.keyErrorMessage(k.name),
              type: "danger" as const,
            })),
          );
        } else {
          setAlerts([{ message: "Speichern fehlgeschlagen: " + (err.reason ?? err.message), type: "danger" }]);
        }
      } else {
        if (props.resetOnSuccess) {
          reset();
        }
        if (props.onSuccess) {
          props.onSuccess();
        }
      }
    };

    if (props.formType === "insert") {
      Assignments.insert(fields as any, callback);
    } else {
      Assignments.update(props.doc._id, { $set: fields }, {}, callback);
    }
  };

  return (
    <form id="assignmentForm" onSubmit={onSubmit}>
      <div className={`panel ${props.panelClass}`}>
        <div className="panel-heading">
          <h3 className="panel-title">
            <i className={`fa ${props.fontAwesomeLogo} fa-fw`}></i> {props.headingText}
          </h3>
        </div>
        <div className="panel-body">
          <fieldset>
            <InlineAlerts alerts={alerts} />
            <div className="form-group" data-required="true">
              <label>Termin</label>
              <div className="datetimepicker">
                <DatePicker
                  selected={start}
                  onChange={(date: Date) => date && setStart(date)}
                  inline
                  showTimeSelect
                  timeIntervals={15}
                  minDate={new Date()}
                  locale="de"
                  timeCaption="Zeit"
                />
              </div>
            </div>

            <div className="form-group" data-required="true">
              <label htmlFor="durationDisplay">Dauer</label>
              <div className="input-group duration">
                <span className="input-group-btn">
                  <button className="btn btn-primary increase" type="button" onClick={() => increaseDuration(-30)}>-30 Min</button>
                  <button className="btn btn-info increase" type="button" onClick={() => increaseDuration(-15)}>-15 Min</button>
                </span>
                <input
                  id="durationDisplay"
                  style={{ textAlign: "center" }}
                  type="text"
                  value={formatDurationShort(duration)}
                  readOnly
                  className="form-control"
                  title={formatDuration(duration)}
                />
                <span className="input-group-btn">
                  <button className="btn btn-info increase" type="button" onClick={() => increaseDuration(15)}>+15 Min</button>
                  <button className="btn btn-primary increase" type="button" onClick={() => increaseDuration(30)}>+30 Min</button>
                </span>
              </div>
            </div>

            {/* Introspection fields, like AutoForm's hidden quick fields. */}
            <input type="hidden" name="start" value={start.toString()} readOnly />
            <input type="hidden" name="end" value={end.toString()} readOnly />
            <input type="hidden" name="group" value={props.currentGroupId} readOnly />

            <div className="form-group">
              <label>Name des Einsatzes</label>
              <input name="name" type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Geschlossen</label>
              <div>
                {[{ label: "Nein", value: "Online" }, { label: "Ja", value: "Closed" }].map((o) => (
                  <label key={o.value} className="radio-inline">
                    <input
                      type="radio"
                      name="state"
                      value={o.value}
                      checked={state === o.value}
                      disabled={isCanceled}
                      onChange={() => setState(o.value)}
                    />{" "}
                    {o.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Teilnehmer-Ziel (bei 0 wird keine Belegung angezeigt)</label>
              <input name="userGoal" type="number" className="form-control" value={userGoal} onChange={(e) => setUserGoal(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Abholpunkt</label>
              <input name="pickup_point" type="text" className="form-control" value={pickupPoint} onChange={(e) => setPickupPoint(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Rückgabepunkt</label>
              <input name="return_point" type="text" className="form-control" value={returnPoint} onChange={(e) => setReturnPoint(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Ansprechpersonen</label>
              <MultiSelect
                inputId="assignmentContacts"
                options={contactOptions ?? []}
                value={contacts}
                onChange={setContacts}
              />
            </div>

            <div className="form-group">
              <label>Notiz</label>
              <textarea name="note" rows={5} className="form-control" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <div className="form-group">
              <button type="submit" className={`btn ${props.buttonClass} submit-change`}>
                <i className={`fa ${props.fontAwesomeLogo}`}></i> {props.submitButtonText}
              </button>
            </div>
          </fieldset>
        </div>
      </div>
    </form>
  );
}

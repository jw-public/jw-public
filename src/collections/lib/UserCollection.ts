import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { Locale } from "../../imports/i18n/classes/I18nProvider";

/**
 * Self-Service-Einstellung eines Koordinators: bei welchen voll gewordenen
 * Terminen seiner Gruppen er benachrichtigt werden möchte.
 * - "all": immer (Default, wenn nicht gesetzt)
 * - "nearOnly": nur wenn der Termin in den nächsten `fullNotifyDays` Tagen
 *   liegt
 * - "none": nie
 *
 * Hieß bis Version 2.1 `ApplicationNotifyMode` und steuerte Nachrichten pro
 * Bewerbung; die Umstellung auf volle Termine ist in ADR 0006 beschrieben,
 * die Übernahme der Altwerte erledigt server/startup.ts.
 */
export type FullNotifyMode = "all" | "nearOnly" | "none";

export interface UserProfile {
  first_name?: string;
  last_name?: string;
  gender?: string;
  language?: Locale;
  mobile?: string;
  mobileE164?: string;
  mobileNat?: string;
  pendingGroups?: string[];
  timezone?: string;
  carMostlyAvailable?: boolean;
  pioneer?: boolean;
  zip?: string;
  placeName?: string;
  notificationAsEmail?: boolean;
  fullNotifyMode?: FullNotifyMode;
  fullNotifyDays?: number;
}

/**
 * Serverseitig gestempelte Zustimmung zu den Nutzungsbedingungen. Liegt
 * bewusst NICHT im (client-schreibbaren) profile: gesetzt wird sie nur in
 * Accounts.onCreateUser bzw. der acceptTerms-Method.
 */
export interface TermsOfUseConsent {
  version: string;
  acceptedAt: Date;
}

/**
 * User Data Access Object
 */
export interface UserDAO extends Meteor.User {
  profile?: UserProfile;
  roles?: string[];
  groups?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  banned?: boolean;
  notice?: string;
  termsOfUse?: TermsOfUseConsent;
  /**
   * Geheimer Token für das persönliche iCal-Kalenderabo (/api/calendar/…).
   * Wird ausschließlich serverseitig erzeugt (getCalendarToken-Method), nie
   * publiziert und ist über die users-Allow-Rule nicht durch den Client
   * änderbar — wer den Token kennt, kann die Termine des Users lesen.
   */
  calendarToken?: string;
}

export const users: Mongo.Collection<UserDAO> = <Mongo.Collection<UserDAO>>(<any>Meteor.users);

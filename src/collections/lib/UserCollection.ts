import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { Locale } from '../../imports/i18n/classes/I18nProvider';

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
}


/**
 * User Data Access Object
 */
export interface UserDAO extends Meteor.User {
  _id?: string;
  profile?: UserProfile;
  roles?: string[];
  groups?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  banned?: boolean;
  notice?: string;
}

export const users: Mongo.Collection<UserDAO> = <Mongo.Collection<UserDAO>>(<any>Meteor.users);

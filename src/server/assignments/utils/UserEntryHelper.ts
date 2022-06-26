import * as _ from "underscore";
import { UserEntry } from "../../../collections/lib/AssignmentsCollection";


export const extractIdsFromUserEntryArray = function (userEntryArray: Array<UserEntry>): Array<string> {
    return _.map(userEntryArray, (userEntry) => {
        return userEntry.user;
    });
};

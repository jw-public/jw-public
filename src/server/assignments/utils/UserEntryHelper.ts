import {UserEntry, AssignmentDAO} from "../../../collections/lib/AssignmentsCollection";
import * as _ from "underscore";


export const extractIdsFromUserEntryArray = function(userEntryArray: Array<UserEntry>): Array < string > {
    return _.map(userEntryArray, (userEntry) => {
        return userEntry.user;
    });
};

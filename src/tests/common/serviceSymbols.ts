// Maps the old kernel symbols (still used as test-case identifiers) onto the
// composition root's service and override keys (see server/services.ts).

import { Types } from "../../server/Types";
import { AssignmentServiceTypes } from "../../server/assignments/AssignmentServiceTypes";
import { MailingTypes } from "../../server/mailing/MailingTypes";
import { UserTypes } from "../../server/user/UserTypes";
import { ServiceOverrides, Services } from "../../server/services";

export const SYMBOL_TO_SERVICE = new Map<symbol, keyof Services>([
  [Types.IAssignmentApplicationControllerFactory, "assignmentApplicationControllerFactory"],
  [Types.IAssignmentParticipantControllerFactory, "assignmentParticipantControllerFactory"],
  [Types.IAssignmentCanceler, "assignmentCanceler"],
  [Types.IAssignmentCloser, "assignmentCloser"],
  [Types.IAssignmentReenabler, "assignmentReenabler"],
  [Types.IAssignmentRemover, "assignmentRemover"],
  [Types.AssignmentWeekCopyPaster, "assignmentWeekCopyPaster"],
  [AssignmentServiceTypes.IAssignmentNotifier, "assignmentNotifier"],
  [AssignmentServiceTypes.IAssignmentEmailNotifier, "assignmentEmailNotifier"],
  [AssignmentServiceTypes.IAssignmentDaoNotifier, "assignmentDaoNotifier"],
  [AssignmentServiceTypes.IAssignmentParticipationNotifier, "participationNotifier"],
  [AssignmentServiceTypes.IAssignmentDateParser, "dateParser"],
  [MailingTypes.IUserMailer, "userMailer"],
  [UserTypes.IUserFactory, "userFactory"],
  [UserTypes.IUserSettingsReaderFactory, "userSettingsReaderFactory"],
]);

export const SYMBOL_TO_OVERRIDE = new Map<symbol, keyof ServiceOverrides>([
  [AssignmentServiceTypes.IAssignmentNotifier, "assignmentNotifier"],
  [AssignmentServiceTypes.IAssignmentEmailNotifier, "assignmentEmailNotifier"],
  [AssignmentServiceTypes.IAssignmentDaoNotifier, "assignmentDaoNotifier"],
  [AssignmentServiceTypes.IAssignmentParticipationNotifier, "participationNotifier"],
  [AssignmentServiceTypes.IAssignmentDateParser, "dateParser"],
  [MailingTypes.IUserMailer, "userMailer"],
  [UserTypes.IUserFactory, "userFactory"],
  [UserTypes.IUserSettingsReaderFactory, "userSettingsReaderFactory"],
  [Types.LoggerFactory, "loggerFactory"],
]);

export function serviceKeyFor(symbol: symbol): keyof Services {
  const key = SYMBOL_TO_SERVICE.get(symbol);
  if (!key) {
    throw new Error(`No service mapping for symbol ${String(symbol)}`);
  }
  return key;
}

export function overrideKeyFor(symbol: symbol): keyof ServiceOverrides {
  const key = SYMBOL_TO_OVERRIDE.get(symbol);
  if (!key) {
    throw new Error(`No override mapping for symbol ${String(symbol)}`);
  }
  return key;
}

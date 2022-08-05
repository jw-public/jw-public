import { inject, injectable, named } from "inversify";
import * as moment from "moment";
import { AssignmentCopyActionDAO } from "../../../collections/lib/AssignmentCopyActionsCollection";
import { AssignmentDAO } from "../../../collections/lib/AssignmentsCollection";
import { AssignmentState } from "../../../collections/lib/classes/AssignmentState";
import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";
import { Logger } from '../../../imports/logging/Logger';
import { LoggerFactory } from '../../../imports/logging/LoggerFactory';
import { Types } from "../../Types";

@injectable()
export class AssignmentWeekCopyPaster {

  private logger: Logger;

  constructor(@inject(Types.Collection) @named("assignment") private assignmentCollection: SimpleCollection<AssignmentDAO>,
    @inject(Types.Collection) @named("assignmentCopyActions") private copyActionsCollection: SimpleCollection<AssignmentCopyActionDAO>,
    @inject(Types.LoggerFactory) loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.createLogger("AssignmentWeekCopyPaster");
  }

  public copyPasteCalendarWeekInGroup({ groupId, from, to }: {
    groupId: string;
    from: {
      calendarWeek: number;
      year: number;
    };
    to: {
      calendarWeek: number;
      year: number;
    };
  }): number {
    const assignments = this.assignmentCollection.find({
      group: groupId,
      isoWeek: from.calendarWeek,
      yearOfIsoWeek: from.year,
    })
    const fromMoment = moment().isoWeek(from.calendarWeek).isoWeekYear(from.year)
    const toMoment = moment().isoWeek(to.calendarWeek).isoWeekYear(to.year)
    const diff = toMoment.diff(fromMoment)

    const copyAction: AssignmentCopyActionDAO = {
      executedDate: new Date(),
      totalCopied: assignments.count(),
      group: groupId,
      fromIsoWeek: from.calendarWeek,
      toIsoWeek: to.calendarWeek,
      fromYearOfIsoWeek: from.year,
      toYearOfIsoWeek: to.year
    }
    const copyActionId = this.copyActionsCollection.insert(copyAction)

    this.logger.info({
      _id: copyActionId,
      ...copyAction
    })

    assignments.forEach((assignment, index, cursor): void => {
      const targetDate = {
        start: moment(assignment.start).add(diff),
        end: moment(assignment.end).add(diff),
      }
      const copied = {
        ...assignment,
        start: targetDate.start.toDate(),
        end: targetDate.end.toDate(),
        isoWeek: targetDate.start.isoWeek(),
        yearOfIsoWeek: targetDate.start.isoWeekYear(),
        participants: [],
        applicants: [],
        state: AssignmentState[AssignmentState.Online],
        copyActionId
      }

      delete copied._id;
      delete copied.stateBeforeLastClose;
      delete copied.cancelationReason;
      delete copied.createdAt;
      delete copied.updatedAt;

      this.assignmentCollection.insert(copied)
    });

    this.logger.info("Copied " + copyAction.totalCopied + " assignments")

    return copyAction.totalCopied;
  }
}

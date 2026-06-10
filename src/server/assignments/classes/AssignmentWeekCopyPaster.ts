import * as moment from "moment";
import { AssignmentCopyActionDAO } from "../../../collections/lib/AssignmentCopyActionsCollection";
import { AssignmentDAO } from "../../../collections/lib/AssignmentsCollection";
import { AssignmentState } from "../../../collections/lib/classes/AssignmentState";
import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";
import { Logger } from '../../../imports/logging/Logger';
import { LoggerFactory } from '../../../imports/logging/LoggerFactory';
import { Types } from "../../Types";

export class AssignmentWeekCopyPaster {

  private logger: Logger;

  constructor(private assignmentCollection: SimpleCollection<AssignmentDAO>,
    private copyActionsCollection: SimpleCollection<AssignmentCopyActionDAO>,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.createLogger("AssignmentWeekCopyPaster");
  }

  public async copyPasteCalendarWeekInGroup({ groupId, from, to }: {
    groupId: string;
    from: {
      calendarWeek: number;
      year: number;
    };
    to: {
      calendarWeek: number;
      year: number;
    };
  }): Promise<number> {
    const assignments = this.assignmentCollection.find({
      group: groupId,
      isoWeek: from.calendarWeek,
      yearOfIsoWeek: from.year,
    })
    const fromMoment = moment().isoWeek(from.calendarWeek).isoWeekYear(from.year)
    const toMoment = moment().isoWeek(to.calendarWeek).isoWeekYear(to.year)
    const diff = toMoment.diff(fromMoment)

    const assignmentDocs = await assignments.fetchAsync();

    const copyAction: AssignmentCopyActionDAO = {
      executedDate: new Date(),
      totalCopied: assignmentDocs.length,
      group: groupId,
      fromIsoWeek: from.calendarWeek,
      toIsoWeek: to.calendarWeek,
      fromYearOfIsoWeek: from.year,
      toYearOfIsoWeek: to.year
    }
    const copyActionId = await this.copyActionsCollection.insertAsync(copyAction)

    this.logger.info({
      _id: copyActionId,
      ...copyAction
    })

    for (const assignment of assignmentDocs) {
      const fromDate = {
        start: moment(assignment.start).tz('Europe/Berlin'),
        end: moment(assignment.end).tz('Europe/Berlin'),
      }
      const targetDate = {
        start: moment(fromDate.start)
          .add(diff)
          .set('hour', fromDate.start.get('hour')), // set to same displayed hour (winter/summer time)
        end: moment(fromDate.end)
          .add(diff)
          .set('hour', fromDate.end.get('hour')), // set to same displayed hour (winter/summer time)
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

      await this.assignmentCollection.insertAsync(copied)
    }

    this.logger.info("Copied " + copyAction.totalCopied + " assignments")

    return copyAction.totalCopied;
  }
}

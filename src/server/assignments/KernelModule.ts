
import { KernelModule, interfaces } from "inversify";

import { IAssignmentApplicationController } from "./interfaces/IAssignmentApplicationController";
import { AssignmentApplicationController } from "./classes/AssignmentApplicationController";
import { IAssignmentApplicationControllerFactory } from "./interfaces/IAssignmentApplicationControllerFactory";

import { IAssignmentParticipantController } from "./interfaces/IAssignmentParticipantController";
import { AssignmentParticipantController } from "./classes/AssignmentParticipantController";
import { IAssignmentParticipantControllerFactory } from "./interfaces/IAssignmentParticipantControllerFactory";

import { IAssignmentParticipationNotifier } from "./interfaces/IAssignmentParticipationNotifier";
import { AssignmentParticipationNotifier } from "./classes/AssignmentParticipationNotifier";

import { IAssignmentRemover } from "./interfaces/IAssignmentRemover";
import { AssignmentRemover } from "./classes/AssignmentRemover";

import { IAssignmentDateParser } from "./interfaces/IAssignmentDateParser";
import { AssignmentDateParser } from "./classes/AssignmentDateParser";

import { IAssignmentCloser } from "./interfaces/IAssignmentCloser";
import { AssignmentCloser } from "./classes/AssignmentCloser";

import { IAssignmentCanceler } from "./interfaces/IAssignmentCanceler";
import { AssignmentCanceler } from "./classes/AssignmentCanceler";

import { IAssignmentReenabler } from "./interfaces/IAssignmentReenabler";
import { AssignmentReenabler } from "./classes/AssignmentReenabler";

import { IAssignmentContext } from "./interfaces/IAssignmentContext";
import { Types } from "../Types";
import { AssignmentServiceTypes } from "./AssignmentServiceTypes";

import { AssignmentEmailNotifier } from "./classes/AssignmentEmailNotifier";
import { IAssignmentEmailNotifier } from "./interfaces/IAssignmentEmailNotifier";

import { AssignmentNotifier } from "./classes/AssignmentNotifier";
import { IAssignmentNotifier } from "./interfaces/IAssignmentNotifier";

import { AssignmentDaoNotifier } from "./classes/AssignmentDaoNotifier";
import { IAssignmentDaoNotifier } from "./interfaces/IAssignmentDaoNotifier";

import { SimpleCollection } from "../../imports/interfaces/SimpleCollection";

import { AssignmentDAO } from "../../collections/lib/AssignmentsCollection";


export const kernelModule = new KernelModule((bind: interfaces.Bind) => {
  bind<IAssignmentApplicationController>(Types.IAssignmentApplicationController).to(AssignmentApplicationController);

  bind<IAssignmentApplicationControllerFactory>(Types.IAssignmentApplicationControllerFactory)
    .toFactory<IAssignmentApplicationController>((context) => {
      return (assignmentId: string) => {
        let applicationController = context.kernel.get<IAssignmentApplicationController>(Types.IAssignmentApplicationController);
        let assignmentContext: IAssignmentContext = {
          getAssignmentId() {
            return assignmentId;
          }
        };

        (<any>applicationController).assignmentContext = assignmentContext;
        return applicationController;
      };
    });

  bind<IAssignmentParticipantController>(Types.IAssignmentParticipantController).to(AssignmentParticipantController);

  bind<IAssignmentParticipantControllerFactory>(Types.IAssignmentParticipantControllerFactory)
    .toFactory<IAssignmentParticipantController>((context) => {
      return (assignmentId: string) => {
        let controller = context.kernel.get<IAssignmentParticipantController>(Types.IAssignmentParticipantController);
        let assignmentContext: IAssignmentContext = {
          getAssignmentId() {
            return assignmentId;
          }
        };

        (<any>controller).assignmentContext = assignmentContext;
        return controller;
      };
    });


  bind<IAssignmentParticipationNotifier>(AssignmentServiceTypes.IAssignmentParticipationNotifier).to(AssignmentParticipationNotifier);
  bind<IAssignmentNotifier>(AssignmentServiceTypes.IAssignmentNotifier).to(AssignmentNotifier);
  bind<IAssignmentEmailNotifier>(AssignmentServiceTypes.IAssignmentEmailNotifier).to(AssignmentEmailNotifier);
  bind<IAssignmentDaoNotifier>(AssignmentServiceTypes.IAssignmentDaoNotifier).to(AssignmentDaoNotifier);
  bind<IAssignmentRemover>(Types.IAssignmentRemover).to(AssignmentRemover);
  bind<IAssignmentCanceler>(Types.IAssignmentCanceler).to(AssignmentCanceler);
  bind<IAssignmentReenabler>(Types.IAssignmentReenabler).to(AssignmentReenabler);
  bind<IAssignmentCloser>(Types.IAssignmentCloser).to(AssignmentCloser);
  bind<IAssignmentDateParser>(AssignmentServiceTypes.IAssignmentDateParser).to(AssignmentDateParser);


});

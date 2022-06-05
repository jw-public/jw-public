import { Accounts } from "meteor/accounts-base";
declare var Modal: any;

import { Routes } from "../../lib/client/routes";

import { TemplateDefinition } from "../../lib/TemplateDefinitionDecorator";
import { EventHandler } from "../../lib/EventHandlerDecorator";
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';


export class ResetController {
  public reset(token: string, password: string) {
    let gotoParam = FlowRouter.getQueryParam("goto");

    Accounts.resetPassword(token, password, function (err) {
      if (err) {
        console.log(err);
        if (err.reason === "Token expired") {
          Alerts.add("Dein Link ist abgelaufen.", "danger", {
            fadeIn: 100
          });
        } else {
          Alerts.add("Passwort ungültig. Mindestens 6 Zeichen.", "danger", {
            fadeIn: 100
          });
        }
      } else {
        Routes.go(Routes.Def.Home);
      }
    });
  }
}

@TemplateDefinition("resetPassword")
export class ResetHandler {
  public static RESET_CONTROLLER: ResetController = new ResetController();

  @EventHandler("submit .reset")
  static resetHandler(event: Event) {
    event.preventDefault();
    Alerts.removeSeen();

    let token: string = FlowRouter.getParam(Routes.ParamNames.Token);
    let password: string = ResetHandler.extractPasswordFromEvent(event);
    console.log("trigger reset");
    ResetHandler.RESET_CONTROLLER.reset(token, password);
  }

  private static extractPasswordFromEvent(event: Event): string {
    return event.target["password"].value;
  }
}


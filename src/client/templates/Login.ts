import {Meteor} from "meteor/meteor";
import {Template} from "meteor/templating";
import {Session} from "meteor/session";
import {Mongo} from "meteor/mongo";
import {Blaze} from "meteor/blaze";
import {Accounts} from "meteor/accounts-base";
declare var Modal: any;

import {Routes} from "../../lib/client/routes";

import {Helper} from "../../lib/HelperDecorator";
import {TemplateDefinition} from "../../lib/TemplateDefinitionDecorator";
import {EventHandler} from "../../lib/EventHandlerDecorator";

namespace Login {

  function trimInput(value: string) {
    return value.replace(/^\s*|\s*$/g, "");
  };

  function isNotEmpty(value) {
    if (value && value !== "") {
      return true;
    }
    Alerts.add("Bitte alle Eingabefelder ausfüllen.", 'danger', {
      fadeIn: 100
    });
    return false;
  };

  function isEmail(value: string) {
    let filter = SimpleSchema.RegEx.Email;
    if (filter.test(value)) {
      return true;
    }
    Alerts.add("Dies ist keine gültige Email Adresse.", "danger", {
      fadeIn: 100
    });
    return false;
  };

  function isValidPassword(password: string) {
    if (password.length < 6) {
      Alerts.add("Dein Passwort muss mindesten 6 Zeichen lang sein.", "danger", {
        fadeIn: 100
      });
      return false;
    }
    return true;
  };

  function areValidPasswords(password: string, confirm: string) {
    if (!isValidPassword(password)) {
      return false;
    }
    if (password !== confirm) {
      Alerts.add("Deine zwei Passwörter sind nicht identisch.", "danger", {
        fadeIn: 100
      });
      return false;
    }
    return true;
  };


export interface ILoginController {
  login: (user: string, password: string) => void;
}

export class LoginController implements ILoginController {
  public login(user: string, password: string) {
    let gotoParam = FlowRouter.getQueryParam("goto");

    Meteor.loginWithPassword(user, password, function(err) {
      if (err) {
        Alerts.add("Benutzer oder Passwort falsch. Bitte noch einmal versuchen.", "danger", {
          fadeIn: 100
        });
      } else {
        let noGotoParam: boolean = gotoParam === undefined;

        if(noGotoParam) {
          Routes.go(Routes.Def.Home);
        } else {
          FlowRouter.go(gotoParam);
        }
      }
    });
  }
}



@TemplateDefinition("Login")
export class LoginHandler {
  public static LOGIN_CONTROLLER: ILoginController = new LoginController();

  @EventHandler("submit .login")
  static loginHandler(event: Event) {
    event.preventDefault();
    Alerts.removeSeen();

    let user: string = LoginHandler.extractUserFromEvent(event);
    let password: string = LoginHandler.extractPasswordFromEvent(event);

    LoginHandler.LOGIN_CONTROLLER.login(user, password);
  }

  private static extractUserFromEvent(event: Event): string {
    return event.target["user"].value.trim().toLowerCase();
  }

  private static extractPasswordFromEvent(event: Event): string {
    return event.target["password"].value;
  }
}



@TemplateDefinition("forgottenPasswordLink")
export class ForgotPasswordHandler {
  @EventHandler("click .forgot_link")
  static forgotPasswordHandler(event: Event) {
    event.preventDefault();
    Alerts.removeSeen();
    Modal.show("forgottenPasswordModal");
  }
}



Template["forgottenPasswordModal"].events({
  "submit .forgotPassword": function(event: Event) {
    event.preventDefault();
    Alerts.removeSeen();
    let email = event.target["email"].value.trim().toLowerCase();
    if (isNotEmpty(email) && isEmail(email)) {
      Accounts.forgotPassword({ email: email }, function(err) {
        if (err) {
          if (err.message === 'User not found [403]') {
            Alerts.add('Diese Email Adresse ist unbekannt.', 'danger', {
              fadeIn: 100
            });
          } else {
            console.log('Error in forgotPassword:' + err.message);
            Alerts.add('Entschuldigung, da ist was falsch gelaufen.', 'danger', {
              fadeIn: 100
            });
          }
        } else {
          Alerts.add('Eine E-Mail wurde versendet. Bitte kontrolliere dein E-Mail Postfach.', 'success', {
            fadeIn: 100
          });
        }
      });

    }
    return false;

  }
});

}

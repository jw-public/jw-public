import {Meteor} from "meteor/meteor";
import {Template} from "meteor/templating";
import {Mongo} from "meteor/mongo";
import {Accounts} from "meteor/accounts-base";
import * as UserCollection from "../collections/lib/UserCollection";


export function initEmailSettings() {

    Accounts.emailTemplates.from = `no-reply@${process.env.VIRTUAL_HOST}`;
    Accounts.emailTemplates.siteName = "Public Assistant";

    (<any>Accounts).urls.resetPassword = function(token) {
      return `${process.env.ROOT_URL}/#/reset-password/${token}`;
    };

    let resetPasswordTemplate: Meteor.EmailFields = {
      subject(user: UserCollection.UserDAO) {
        return `Passwort für ${user.profile.first_name} ${user.profile.last_name} zurücksetzen.`;
      },
      text(user: UserCollection.UserDAO, url: string) {
        return `Hallo ${user.profile.first_name} ${user.profile.last_name},

klicke bitte auf den folgenden Link damit Du dein Passwort zurücksetzen kannst.
Dieser Link öffnet einen Webbrowser:
${url}
Wenn dieser Link keinen Webbrowser öffnet, kopierst Du einfach
den Link in der oberen Zeile bis zum Ende
und fügst es in das Adressfeld eines Webbrowsers ein.
Bitte merke Dir nach dem Ändern das neue Passwort!
Herzlichen Dank!


Liebe Grüße,
deine Brüder im Organisationsteam`;
      }
    }

    Accounts.emailTemplates.resetPassword = resetPasswordTemplate;
  }

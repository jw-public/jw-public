import * as React from "react";
import { createRoot } from "react-dom/client";

import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import { RouterProvider } from "react-router-dom";

import { router, Routes } from "../../lib/client/routes";

import moment from "moment";
require("moment/locale/de");

Meteor.startup(function () {
  moment.locale("de");
  bootbox.setLocale("de");

  Accounts.onLogout(function () {
    Routes.go(Routes.Def.Login); // Wenn sich ein Benutzer ausgeloggt hat, wollen wir ihn zum Login schicken.
  });

  Accounts.onLogin(function () {
    if (window.location.pathname === Routes.Def.Login.path) {
      Routes.go(Routes.Def.Home);
    }
  });

  const container = document.getElementById("react-target");
  const root = createRoot(container);
  root.render(<RouterProvider router={router} />);
});

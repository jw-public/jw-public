import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Link, Outlet } from "react-router-dom";

import { version } from "../../Version";
import { Def, buildPath } from "../../lib/RoutePaths";

import NotificationsDropdown from "../templates/notifications/NotificationsDropdownComponent";
import Sidebar from "./Sidebar";

function UserDropdown(): JSX.Element {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDocumentClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onDocumentClick);
    return () => document.removeEventListener("click", onDocumentClick);
  }, [open]);

  return (
    <li className={`dropdown${open ? " open" : ""}`} ref={rootRef}>
      <a
        className="dropdown-toggle"
        id="dropdown-user-toggle"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setOpen(!open);
        }}
      >
        <i className="fa fa-user fa-fw"></i> <i className="fa fa-caret-down"></i>
      </a>
      <ul className="dropdown-menu dropdown-user" style={{ display: open ? "block" : "none" }}>
        <li>
          <Link to={buildPath(Def.MyProfile)} onClick={() => setOpen(false)}>
            <i className="fa fa-user fa-fw"></i> Meine Daten</Link>
        </li>
        <li className="divider"></li>
        <li>
          <Link to={buildPath(Def.Logout)} onClick={() => setOpen(false)}>
            <i className="fa fa-sign-out fa-fw"></i> Abmelden</Link>
        </li>
      </ul>
    </li>
  );
}

export default function MainLayout(): JSX.Element {
  return (
    <div id="wrapper">
      <nav className="navbar navbar-default navbar-static-top" role="navigation" style={{ marginBottom: 0 }}>
        <div className="navbar-header">
          <button type="button" className="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
            <span className="sr-only">Toggle navigation</span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
          </button>
          <Link
            className="navbar-custom-brand auto-scroll"
            to={buildPath(Def.Home)}
            title={`Version ${version.commit} #${version.build}`}
          >
            PublicAssistant
          </Link>
        </div>

        <ul className="nav navbar-top-links navbar-right">
          <li className="dropdown" id="notificationsDropdown">
            <NotificationsDropdown />
          </li>
          <UserDropdown />
        </ul>

        <Sidebar />
      </nav>

      <div id="page-wrapper">
        <Outlet />
      </div>
    </div>
  );
}

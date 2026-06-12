import * as React from "react";
import { Meteor } from "meteor/meteor";
import { ReactiveVar } from "meteor/reactive-var";
import { useTracker } from "meteor/react-meteor-data";
import { createBrowserRouter, Navigate, useLocation } from "react-router-dom";

import User from "../../collections/lib/classes/User";

import { Def as PathDef, buildPath } from "../RoutePaths";
const Def = PathDef;

import MainLayout from "../../client/layouts/MainLayout";
import ParallaxLayout from "../../client/layouts/ParallaxLayout";

import Dashboard from "../../client/templates/DashboardComponent";
import Login from "../../client/templates/LoginComponent";
import ModifyProfile from "../../client/templates/ModifyProfileComponent";
import ResetPassword from "../../client/templates/ResetPasswordComponent";
import RegisterInGroup from "../../client/templates/Registration/RegisterInGroupComponent";
import RequireTermsConsent from "../../client/templates/Terms/RequireTermsConsent";
import TermsOfUsePage from "../../client/templates/Terms/TermsOfUsePage";
import AdminUsers from "../../client/templates/admin/UserManagement/AdminUsersComponent";
import ModifyGroups from "../../client/templates/admin/GroupManagement/ModifyGroupsComponent";
import CopyAssignments from "../../client/templates/Group/CopyAssignmentsComponent";
import GroupMembers from "../../client/templates/Group/GroupMembersComponent";
import InfoSite from "../../client/templates/Group/InfoSiteComponent";
import ManageApplicants from "../../client/templates/Group/ManageApplicantsComponent";
import ManageAssignments from "../../client/templates/Group/ManageAssignmentsComponent";
import { ManageBlueprintsComponent } from "../../client/templates/Group/ManageBlueprintsComponent";
import ShowOverview from "../../client/templates/assignments/showOverview/ShowOverviewComponent";
import SingleAssignmentView from "../../client/templates/assignments/showSingle/SingleAssignmentViewComponent";

// ---------------------------------------------------------------------------
// Reactive bridge: components and plain classes keep reading the current
// route params through Tracker (as they did with FlowRouter.getParam).
// ---------------------------------------------------------------------------

const currentParamsVar = new ReactiveVar<{ [key: string]: string }>({});
const currentSearchVar = new ReactiveVar<string>("");

function syncRouterState(state: { matches: Array<{ params: any }>; location: { search: string } }) {
  const params: { [key: string]: string } = {};
  state.matches.forEach((m) => Object.assign(params, m.params));
  currentParamsVar.set(params);
  currentSearchVar.set(state.location.search ?? "");
}

// ---------------------------------------------------------------------------
// Route guards (replacing the FlowRouter triggersEnter)
// ---------------------------------------------------------------------------

function LoadingSpinner(): JSX.Element {
  return (
    <div className="text-center" style={{ paddingTop: "100px" }}>
      <i className="fa fa-spinner fa-pulse fa-5x"></i>
    </div>
  );
}

function RequireLogin(props: { children: JSX.Element }): JSX.Element {
  const location = useLocation();
  const { userId, loggingIn } = useTracker(
    () => ({
      userId: Meteor.userId(),
      loggingIn: Meteor.loggingIn(),
    }),
    [],
  );

  if (userId) {
    return props.children;
  }
  if (loggingIn) {
    return <LoadingSpinner />;
  }
  return (
    <Navigate
      to={`${buildPath(Def.Login)}?goto=${encodeURIComponent(location.pathname)}`}
      replace
    />
  );
}

// Unlike the old FlowRouter trigger, this waits for the user document before
// deciding — fixing the cold-load redirect of /admin/* routes.
function RequireAdmin(props: { children: JSX.Element }): JSX.Element {
  const location = useLocation();
  const state = useTracker(() => {
    const userId = Meteor.userId();
    const loggingIn = Meteor.loggingIn();
    if (!userId) {
      return { decision: loggingIn ? "wait" : "redirect-login" };
    }
    // Wait for the own role assignments before deciding — otherwise admins
    // get bounced to the dashboard on cold loads. (The null publication has
    // no client-side ready() signal, hence the named twin "ownRoles".)
    const rolesSub = Meteor.subscribe("ownRoles");
    if (!Meteor.user() || !rolesSub.ready()) {
      return { decision: "wait" };
    }
    return { decision: new User(userId).isAdmin() ? "render" : "redirect-home" };
  }, []);

  switch (state.decision) {
    case "render":
      return props.children;
    case "wait":
      return <LoadingSpinner />;
    case "redirect-login":
      return (
        <Navigate
          to={`${buildPath(Def.Login)}?goto=${encodeURIComponent(location.pathname)}`}
          replace
        />
      );
    default:
      return <Navigate to={buildPath(Def.Home)} replace />;
  }
}

function RequireLoggedOut(props: { children: JSX.Element }): JSX.Element {
  const user = useTracker(() => Meteor.user(), []);
  if (user) {
    return <Navigate to={buildPath(Def.Home)} replace />;
  }
  return props.children;
}

function Logout(): JSX.Element {
  // On a Meteor 3 cold load the client looks fully logged out until the DDP
  // connection is up AND the async resume login has hydrated the session —
  // Meteor.userId() and Meteor.loggingIn() are both falsy in that window.
  // Logging out (or leaving) during the window is a server-side no-op and
  // the resume re-establishes the session right afterwards. So we poll: log
  // out whenever a settled user appears, and only leave once the client has
  // stayed logged-out past a grace deadline.
  React.useEffect(() => {
    let cancelled = false;
    const graceDeadline = Date.now() + 3000;
    const tick = () => {
      if (cancelled) {
        return;
      }
      if (Meteor.loggingIn()) {
        setTimeout(tick, 100);
        return;
      }
      if (Meteor.userId()) {
        Meteor.logout(() => tick());
        return;
      }
      if (Date.now() < graceDeadline) {
        setTimeout(tick, 100);
        return;
      }
      void router.navigate(buildPath(Def.Login));
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, []);
  return <LoadingSpinner />;
}

// The old emailserver settings route rendered a missing template — an empty
// content area. Kept for parity until the page is built or removed.
function EmptyPage(): JSX.Element {
  return <div />;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const router = createBrowserRouter([
  {
    element: <ParallaxLayout />,
    children: [
      {
        path: Def.Login.path,
        element: (
          <RequireLoggedOut>
            <Login />
          </RequireLoggedOut>
        ),
      },
      { path: Def.UserRegistration.path, element: <RegisterInGroup /> },
      { path: Def.ResetPassword.path, element: <ResetPassword /> },
      { path: Def.TermsOfUse.path, element: <TermsOfUsePage /> },
    ],
  },
  {
    element: (
      <RequireLogin>
        <RequireTermsConsent>
          <MainLayout />
        </RequireTermsConsent>
      </RequireLogin>
    ),
    children: [
      { path: Def.Home.path, element: <Dashboard /> },
      { path: Def.AssignmentOverview.path, element: <ShowOverview /> },
      { path: Def.AssignmentManagement.path, element: <ManageAssignments /> },
      { path: Def.AssignmentSingleView.path, element: <SingleAssignmentView /> },
      { path: Def.MyProfile.path, element: <ModifyProfile /> },
      { path: Def.GroupApplicants.path, element: <ManageApplicants /> },
      { path: Def.GroupMembers.path, element: <GroupMembers /> },
      { path: Def.InfoSite.path, element: <InfoSite /> },
      { path: Def.BlueprintManagement.path, element: <ManageBlueprintsComponent /> },
      { path: Def.CopyAssignments.path, element: <CopyAssignments /> },
      {
        path: Def.UserManagement.path,
        element: (
          <RequireAdmin>
            <AdminUsers />
          </RequireAdmin>
        ),
      },
      {
        path: Def.GroupManagement.path,
        element: (
          <RequireAdmin>
            <ModifyGroups />
          </RequireAdmin>
        ),
      },
      {
        path: Def.EmailServerManagement.path,
        element: (
          <RequireAdmin>
            <EmptyPage />
          </RequireAdmin>
        ),
      },
    ],
  },
  { path: Def.Logout.path, element: <Logout /> },
]);

syncRouterState(router.state as any);
router.subscribe((state) => syncRouterState(state as any));

// ---------------------------------------------------------------------------
// Routes namespace — same surface the FlowRouter-era code used.
// ---------------------------------------------------------------------------

export namespace Routes {
  export const ParamNames = {
    GroupId: "groupId",
    YearMonth: "yearMonth",
    AssignmentId: "assignmentId",
    Token: "token",
  };

  export const Def = PathDef;
  export type Def = PathDef;

  export function go(route: PathDef, params?: { [key: string]: string }): void {
    void router.navigate(buildPath(route, params));
  }

  export function goToPath(path: string): void {
    void router.navigate(path);
  }

  export function path(route: PathDef, params?: { [key: string]: string }): string {
    return buildPath(route, params);
  }

  /** Reactive read of a current route param (Tracker-aware). */
  export function getParam(name: string): string {
    return currentParamsVar.get()[name];
  }

  /** Reactive read of a current query param (Tracker-aware). */
  export function getQueryParam(name: string): string | undefined {
    const search = new URLSearchParams(currentSearchVar.get());
    return search.get(name) ?? undefined;
  }
}

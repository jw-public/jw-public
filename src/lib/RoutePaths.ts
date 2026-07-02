// Pure route definitions and path building — usable from isomorphic code
// (e.g. UserNotification builds links) without pulling in react-router.

export const ParamNames = {
  GroupId: "groupId",
  YearMonth: "yearMonth",
  AssignmentId: "assignmentId",
  Token: "token",
};

export class Def {
  constructor(
    public name: string,
    public path: string,
  ) {}

  static Home = new Def("home", "/");
  static AssignmentOverview = new Def(
    "assignment-list",
    "/group/:" + ParamNames.GroupId + "/:" + ParamNames.YearMonth + "/overview",
  );
  static AssignmentManagement = new Def(
    "manage-assignment",
    "/group/:" + ParamNames.GroupId + "/manage-assignments",
  );
  static AssignmentSingleView = new Def("singleAssignment", "/einsatz/:" + ParamNames.AssignmentId);
  static UserManagement = new Def("adminUsers", "/admin/users");
  static GroupManagement = new Def("modifyGroups", "/admin/groups");
  static MyProfile = new Def("modifyProfile", "/my-profile");
  static Login = new Def("login", "/login");
  static Logout = new Def("logout", "/logout");
  static UserRegistration = new Def(
    "registerInGroup",
    "/group/:" + ParamNames.GroupId + "/registrierung",
  );
  static GroupApplicants = new Def(
    "groupApplicants",
    "/group/:" + ParamNames.GroupId + "/bewerber",
  );
  static GroupMembers = new Def("groupMembers", "/group/:" + ParamNames.GroupId + "/mitglieder");
  static InfoSite = new Def("infoSite", "/info");
  static BlueprintManagement = new Def(
    "manage-blueprints",
    "/group/:" + ParamNames.GroupId + "/manage-blueprints",
  );
  static CopyAssignments = new Def(
    "copyAssignments",
    "/group/:" + ParamNames.GroupId + "/copy-assignments",
  );
  static ResetPassword = new Def("resetPassword", "/reset-password/:" + ParamNames.Token);
  static TermsOfUse = new Def("termsOfUse", "/nutzungsbedingungen");
  static Cleanup = new Def("cleanup", "/admin/cleanup");

  /** Find a definition by its (FlowRouter era) route name. */
  static byName(name: string): Def | undefined {
    const all = Object.keys(Def)
      .map((k) => (Def as any)[k])
      .filter((v) => v instanceof Def) as Def[];
    return all.find((d) => d.name === name);
  }
}

export function buildPath(def: Def, params?: { [key: string]: string }): string {
  let result = def.path;
  if (params) {
    Object.keys(params).forEach((key) => {
      result = result.replace(":" + key, params[key]);
    });
  }
  return result;
}

import { Accounts } from "meteor/accounts-base";
import { Roles } from "meteor/alanning:roles";
import { Assignments } from "../collections/lib/AssignmentsCollection";
import Group from "../collections/lib/classes/Group";
import { GroupDAO, Groups } from "../collections/lib/GroupCollection";

const adminUser = {
  vorname: "Admin",
  nachname: "User",
  gender: "Male",
  email: "admin@trolley.com",
  roles: ["admin"],
  password: "admin3210"
}

export function initData() {
  let adminUserId = initUser();
  let groupId = initGroup(adminUserId);

  // Group object
  let group: Group = Group.createFromId(groupId);

  // Add user to group as member
  group.addUserAsGroupMemberById(adminUserId);
  console.log("Adding admin to group");


  Assignments.insert({
    contacts: [adminUserId],
    creator: adminUserId,
    group: groupId,
    name: "Test-Termin",
    start: new Date(),
    end: new Date(),
  })
}

function initGroup(adminUserId: string): string {
  let group: GroupDAO = {
    name: "Standardgruppe",
    coordinators: [
      adminUserId
    ],
    additional: "Standardgruppe",
    creator: adminUserId
  }
  console.log("Adding new group: ", group.name);
  return Groups.insert(group)
}

function initUser() {

  let id = Accounts.createUser({
    username: "root",
    email: adminUser.email,
    password: adminUser.password,
    profile: {
      first_name: adminUser.vorname,
      last_name: adminUser.nachname,
      gender: adminUser.gender,
      mobile: "08122 894327",
      zip: "85435",
      placeName: "Erding"
    }
  });
  if (adminUser.roles.length > 0) {
    Roles.addUsersToRoles([id], adminUser.roles);
  }
  console.log("Added new user: ", adminUser.email);
  return id;
}
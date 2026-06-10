import { Accounts } from "meteor/accounts-base";
import { Roles } from "meteor/alanning:roles";
import { Assignments } from "../collections/lib/AssignmentsCollection";
import { GroupDAO, Groups } from "../collections/lib/GroupCollection";
import { users } from "../collections/lib/UserCollection";

const adminUser = {
  vorname: "Admin",
  nachname: "User",
  gender: "Male",
  email: "admin@trolley.com",
  roles: ["admin"],
  password: "admin3210",
};

export async function initData(): Promise<void> {
  let adminUserId = await initUser();
  let groupId = await initGroup(adminUserId);

  // Add user to group as member (raw update — the domain classes are
  // client-oriented and synchronous).
  await users.updateAsync(adminUserId, { $addToSet: { groups: groupId } });
  console.log("Adding admin to group");

  await Assignments.insertAsync({
    contacts: [adminUserId],
    creator: adminUserId,
    group: groupId,
    name: "Test-Termin",
    start: new Date(),
    end: new Date(),
  });
}

async function initGroup(adminUserId: string): Promise<string> {
  let group: GroupDAO = {
    name: "Standardgruppe",
    coordinators: [adminUserId],
    additional: "Standardgruppe",
    creator: adminUserId,
  };
  console.log("Adding new group: ", group.name);
  return await Groups.insertAsync(group);
}

async function initUser(): Promise<string> {
  let id = await Accounts.createUserAsync({
    username: "root",
    email: adminUser.email,
    password: adminUser.password,
    profile: {
      first_name: adminUser.vorname,
      last_name: adminUser.nachname,
      gender: adminUser.gender,
      mobile: "08122 894327",
      zip: "85435",
      placeName: "Erding",
    },
  });
  if (adminUser.roles.length > 0) {
    for (const r of adminUser.roles) {
      await Roles.createRoleAsync(r, { unlessExists: true });
    }
    await Roles.addUsersToRolesAsync([id], adminUser.roles);
  }
  console.log("Added new user: ", adminUser.email);
  return id;
}

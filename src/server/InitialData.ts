import { Accounts } from "meteor/accounts-base";
import { Roles } from "meteor/alanning:roles";
import { Assignments } from "../collections/lib/AssignmentsCollection";
import { GroupDAO, Groups } from "../collections/lib/GroupCollection";
import { users } from "../collections/lib/UserCollection";
import { TERMS_OF_USE_VERSION } from "../imports/terms/TermsOfUse";

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

  await initLegacyUser(groupId);

  await Assignments.insertAsync({
    contacts: [adminUserId],
    creator: adminUserId,
    group: groupId,
    name: "Test-Termin",
    participants: [],
    applicants: [],
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
    // Custom-Option, gestempelt in Accounts.onCreateUser (server/startup.ts)
    termsOfUseAccepted: TERMS_OF_USE_VERSION,
  } as any);
  if (adminUser.roles.length > 0) {
    for (const r of adminUser.roles) {
      await Roles.createRoleAsync(r, { unlessExists: true });
    }
    await Roles.addUsersToRolesAsync([id], adminUser.roles);
  }
  console.log("Added new user: ", adminUser.email);
  return id;
}

/**
 * Simuliert ein Bestandskonto aus der Zeit VOR den Nutzungsbedingungen:
 * registriert mit Zustimmung (anders kommt man an validateNewUser nicht
 * vorbei) und der Consent danach wieder entfernt. Damit lässt sich das
 * Login-Consent-Gate manuell und in den E2E-Tests durchspielen.
 */
async function initLegacyUser(groupId: string): Promise<void> {
  const id = await Accounts.createUserAsync({
    email: "legacy@trolley.com",
    password: "legacy3210",
    profile: {
      first_name: "Lena",
      last_name: "Altbestand",
      gender: "Female",
      mobile: "08122 894328",
      zip: "85435",
      placeName: "Erding",
      pendingGroups: [groupId],
    },
    termsOfUseAccepted: TERMS_OF_USE_VERSION,
  } as any);
  await users.updateAsync(id, {
    $unset: { termsOfUse: "", "profile.pendingGroups": "" },
    $addToSet: { groups: groupId },
  });
  console.log("Added legacy user without terms consent: legacy@trolley.com");
}

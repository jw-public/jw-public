import { Meteor } from "meteor/meteor";
import { Roles } from "meteor/alanning:roles";

// alanning:roles v4 is async-only on the server and sync on the client.
// On Meteor 2.x the server side bridges via Promise.await (fibers); at the
// Meteor 3 jump this helper becomes async and callers await it.

export function userIsInRole(userId: string, role: string | string[]): boolean {
  if (!userId) {
    return false;
  }
  if (Meteor.isServer) {
    return (Promise as any).await(Roles.userIsInRoleAsync(userId, role));
  }
  return Roles.userIsInRole(userId, role);
}

export function userIsAdmin(userId: string): boolean {
  return userIsInRole(userId, "admin");
}

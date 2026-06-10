import { Meteor } from "meteor/meteor";
import { Roles } from "meteor/alanning:roles";

// alanning:roles v4 is async-only on the server and sync on the client.

/** Client-side (reactive, minimongo). Throws on the server. */
export function userIsInRole(userId: string, role: string | string[]): boolean {
  if (Meteor.isServer) {
    throw new Error(
      "userIsInRole is client-only on Meteor 3 — use userIsInRoleAsync on the server.",
    );
  }
  if (!userId) {
    return false;
  }
  return Roles.userIsInRole(userId, role);
}

export function userIsAdmin(userId: string): boolean {
  return userIsInRole(userId, "admin");
}

/** Server-side. */
export async function userIsInRoleAsync(userId: string, role: string | string[]): Promise<boolean> {
  if (!userId) {
    return false;
  }
  return await Roles.userIsInRoleAsync(userId, role);
}

export async function userIsAdminAsync(userId: string): Promise<boolean> {
  return await userIsInRoleAsync(userId, "admin");
}

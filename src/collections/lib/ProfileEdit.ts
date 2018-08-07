import * as UserCollection from "./UserCollection";


export const FORM_ID = "profileUpdate";

export function getValidationContext() {
  return UserCollection.users.simpleSchema().namedContext(FORM_ID);
}

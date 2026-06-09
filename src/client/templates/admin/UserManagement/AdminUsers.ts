import { Template } from "meteor/templating";
import AdminUsers from "./AdminUsersComponent";

Template["adminUsers"].helpers({
    AdminUsersComponent(): any {
        return AdminUsers;
    }
});

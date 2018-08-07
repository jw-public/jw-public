import { Session } from "meteor/session";
import { ReactiveVar } from "meteor/reactive-var";

export interface ReactiveVarWrapperOptions<T> {
    nameOfSessionVar: string;
    defaultValue?: T;
}

export class ReactiveVarWrapper<T> implements ReactiveVar<T> {

    constructor(private options: ReactiveVarWrapperOptions<T>) {
        Session.setDefault(options.nameOfSessionVar, options.defaultValue);
    }


    get(): T {
        return Session.get(this.options.nameOfSessionVar);
    }

    set(newValue: T): void {
        Session.set(this.options.nameOfSessionVar, newValue);
    }

}
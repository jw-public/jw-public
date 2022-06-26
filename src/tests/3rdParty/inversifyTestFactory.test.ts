import { expect } from "chai";
import { inject, injectable, Kernel } from "inversify";
import "reflect-metadata";

let TYPES = {
    IWarrior: Symbol("IWarrior"),
    IWeapon: Symbol("IWeapon"),
    IWarriorFactory: Symbol("IWarriorFactory")
}

interface IWarriorFactory extends Function {
    (rank: string): IWarrior;
}

interface IWeapon { }

@injectable()
class Katana implements IWeapon { }

interface IWarrior {
    weapon: IWeapon;
    rank: string;
}

@injectable()
class Warrior implements IWarrior {
    public weapon: IWeapon;
    public rank: string;
    public constructor(
        @inject(TYPES.IWeapon) weapon: IWeapon
    ) {
        this.weapon = weapon;
        this.rank = null; // important!
    }
}

let kernel = new Kernel();
kernel.bind<IWarrior>(TYPES.IWarrior).to(Warrior);
kernel.bind<IWeapon>(TYPES.IWeapon).to(Katana);

kernel.bind<IWarriorFactory>(TYPES.IWarriorFactory)
    .toFactory<IWarrior>((context) => {
        return (rank: string) => {
            let warrior = context.kernel.get<IWarrior>(TYPES.IWarrior);
            warrior.rank = rank;
            return warrior;
        };
    });




describe("InversifyJS - Factory", function () {
    it("integrates", function () {
        let warriorFactory = kernel.get<IWarriorFactory>(TYPES.IWarriorFactory);
        let master = warriorFactory("master");
        let student = warriorFactory("student");

        expect(master.rank).eql("master");
        expect(student.rank).eql("student");
    });
});

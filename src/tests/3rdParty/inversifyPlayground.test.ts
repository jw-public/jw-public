import "reflect-metadata";
import { injectable, inject, Kernel } from "inversify";
import {expect} from "chai";


interface IWarrior {
  fight(): string;
  sneak(): string;
}

interface IWeapon {
  hit(): string;
}

interface IThrowableWeapon {
  throw(): string;
}

export const TYPES = {
  Warrior: Symbol("Warrior"),
  Weapon: Symbol("Weapon"),
  ThrowableWeapon: Symbol("ThrowableWeapon")
};



@injectable()
class Katana implements IWeapon {
  public hit() {
    return "cut!";
  }
}

@injectable()
class Shuriken implements IThrowableWeapon {
  public throw() {
    return "hit!";
  }
}

@injectable()
class Ninja implements Ninja {

  private _katana: IWeapon;
  private _shuriken: IThrowableWeapon;

  public constructor(
    @inject(TYPES.Weapon) katana: IWeapon,
    @inject(TYPES.ThrowableWeapon) shuriken: IThrowableWeapon
    ) {
    this._katana = katana;
    this._shuriken = shuriken;
  }

  public fight() { return this._katana.hit(); };
  public sneak() { return this._shuriken.throw(); };
}

var kernel = new Kernel();
kernel.bind<IWarrior>(TYPES.Warrior).to(Ninja);
kernel.bind<IWeapon>(TYPES.Weapon).to(Katana);
kernel.bind<IThrowableWeapon>(TYPES.ThrowableWeapon).to(Shuriken);





describe("InversifyJS", function() {
  it("integrates", function() {
    var ninja = kernel.get<IWarrior>(TYPES.Warrior);

    expect(ninja.fight()).eql("cut!"); // true
    expect(ninja.sneak()).eql("hit!"); // true
  });
});

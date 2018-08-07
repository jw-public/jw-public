import { BlueprintTypes } from './BlueprintTypes';
import { IBlueprintMaterializer } from './interfaces/IBlueprintMaterializer';
import { BlueprintMaterializer } from './classes/BlueprintMaterializer';

import { KernelModule, interfaces } from "inversify";




import { SimpleCollection } from "../../imports/interfaces/SimpleCollection";




export const kernelModule = new KernelModule((bind: interfaces.Bind) => {

  bind<IBlueprintMaterializer>(BlueprintTypes.IBlueprintMaterializer).to(BlueprintMaterializer);

});

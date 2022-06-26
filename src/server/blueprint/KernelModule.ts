import { BlueprintTypes } from './BlueprintTypes';
import { BlueprintMaterializer } from './classes/BlueprintMaterializer';
import { IBlueprintMaterializer } from './interfaces/IBlueprintMaterializer';

import { interfaces, KernelModule } from "inversify";








export const kernelModule = new KernelModule((bind: interfaces.Bind) => {

  bind<IBlueprintMaterializer>(BlueprintTypes.IBlueprintMaterializer).to(BlueprintMaterializer);

});

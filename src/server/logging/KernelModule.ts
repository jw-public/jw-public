import { interfaces, KernelModule } from 'inversify';
import { JsnLogFactory } from '../../imports/logging/JsnLogFactory';
import { LoggerFactory } from '../../imports/logging/LoggerFactory';
import { Types } from '../Types';





export const kernelModule = new KernelModule((bind: interfaces.Bind) => {
  bind<LoggerFactory>(Types.LoggerFactory).to(JsnLogFactory).inSingletonScope();
});

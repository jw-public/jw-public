import {Template} from "meteor/templating";

declare var SubsCache: any;

export const subsCache = new SubsCache({ expireAter: 60 });

Template.registerHelper("cachedSubsReady", function(): boolean {
  return subsCache.allReady.get();
});

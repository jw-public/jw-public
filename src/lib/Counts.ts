import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

// Minimal replacement for tmeasday:publish-counts (whose Meteor-3-compatible
// versions are unavailable). Same wire shape: a client-only "counts"
// collection with one doc per counter.

export const CountsCollection = new Mongo.Collection<{ _id: string; count: number }>(
  Meteor.isClient ? "counts" : null,
);

export const Counts = {
  get(name: string): number {
    const doc = CountsCollection.findOne(name);
    return doc ? doc.count : 0;
  },
};

/**
 * Publish the (live) count of a cursor under the given counter name.
 * Call from inside a Meteor.publish function.
 */
export async function publishCount(
  publication: Pick<Subscription, "added" | "changed" | "removed" | "onStop" | "ready">,
  name: string,
  cursor: Mongo.Cursor<any>,
): Promise<void> {
  let count = 0;
  let initializing = true;

  const handle = await (cursor as any).observeChangesAsync({
    added: () => {
      count++;
      if (!initializing) {
        publication.changed("counts", name, { count });
      }
    },
    removed: () => {
      count--;
      publication.changed("counts", name, { count });
    },
  });

  initializing = false;
  publication.added("counts", name, { count });
  publication.onStop(() => handle.stop());
  publication.ready();
}

interface Subscription {
  added(collection: string, id: string, fields: object): void;
  changed(collection: string, id: string, fields: object): void;
  removed(collection: string, id: string): void;
  onStop(func: Function): void;
  ready(): void;
}

import { useEffect } from "react";
import { Meteor } from "meteor/meteor";
import { Tracker } from "meteor/tracker";
import { useTracker } from "meteor/react-meteor-data";

/**
 * Abonnement-Cache: hält ein Abonnement nach dem Unmount noch eine Weile am
 * Leben, damit der Wechsel zurück auf einen bereits geladenen Monat ohne
 * Server-Roundtrip und ohne Ladezustand auskommt.
 *
 * Ersetzt das Blaze-zeitliche `ccorcos:subs-cache` (siehe das gelöschte
 * client/lib/subscription-cache.ts), das bei der React-Migration ersatzlos
 * entfallen ist: seither ist jeder Klick im Monats-Paginator ein neuer
 * Roundtrip.
 *
 * Abgelaufen wird ausschließlich, was gerade niemand benutzt (`refCount === 0`)
 * — ein Eintrag kann einer offenen Ansicht also nicht unter den Füßen
 * weggeräumt werden, egal wie lange sie offen steht.
 */

const TTL_MS = 30 * 60 * 1000;
/** Obergrenze für ungenutzte Abonnements; aktive zählen nicht mit. */
const MAX_IDLE_ENTRIES = 12;

interface CacheEntry {
  handle: Meteor.SubscriptionHandle;
  refCount: number;
  idleSince: number;
  expiryTimer: ReturnType<typeof setTimeout> | undefined;
}

const cache = new Map<string, CacheEntry>();

function stopAndDelete(key: string): void {
  const entry = cache.get(key);
  if (!entry) {
    return;
  }
  if (entry.expiryTimer !== undefined) {
    clearTimeout(entry.expiryTimer);
  }
  entry.handle.stop();
  cache.delete(key);
}

function evictSurplusIdleEntries(): void {
  const idle = Array.from(cache.entries())
    .filter(([, entry]) => entry.refCount === 0)
    .sort((a, b) => a[1].idleSince - b[1].idleSince);

  for (let i = 0; i < idle.length - MAX_IDLE_ENTRIES; i++) {
    stopAndDelete(idle[i][0]);
  }
}

function armExpiry(key: string, entry: CacheEntry): void {
  entry.idleSince = Date.now();
  entry.expiryTimer = setTimeout(() => stopAndDelete(key), TTL_MS);
}

/**
 * Legt das Abonnement an, falls es noch nicht existiert. Der Verfallszeitpunkt
 * wird dabei bewusst sofort gesetzt und erst vom Effekt entschärft: ein im
 * Rendern angelegtes Abonnement, dessen Komponente nie mountet (abgebrochenes
 * Rendern), liefe sonst ohne Besitzer und ohne Ablauf weiter.
 */
function acquire(key: string, name: string, args: unknown[]): CacheEntry {
  const existing = cache.get(key);
  if (existing) {
    return existing;
  }

  // Bewusst außerhalb jeder Computation: würde hier eine useTracker-Berechnung
  // laufen, stoppte Meteor das Abonnement bei deren nächster Invalidierung —
  // und der Cache wäre wirkungslos.
  const entry: CacheEntry = {
    handle: Tracker.nonreactive(() => Meteor.subscribe(name, ...args)),
    refCount: 0,
    idleSince: Date.now(),
    expiryTimer: undefined,
  };
  cache.set(key, entry);
  armExpiry(key, entry);
  evictSurplusIdleEntries();

  return entry;
}

/**
 * Wie `Meteor.subscribe`, nur dass das Abonnement den Unmount überlebt.
 * @returns ob die Daten da sind — reaktiv, also innerhalb von `useTracker`
 *          ebenso brauchbar wie im Rendern.
 */
export function useCachedSubscription(name: string, ...args: unknown[]): boolean {
  // Abo-Argumente sind in dieser App immer primitiv (IDs, "YYYY-MM"), daher
  // reicht JSON für einen stabilen Schlüssel.
  const key = JSON.stringify([name, args]);

  // Beim ersten Rendern anlegen, damit der erste useTracker-Durchlauf schon
  // einen Handle vorfindet (Meteor.subscribe im Rendern tat bisher dasselbe).
  acquire(key, name, args);

  useEffect(() => {
    const entry = acquire(key, name, args);
    entry.refCount += 1;
    if (entry.expiryTimer !== undefined) {
      clearTimeout(entry.expiryTimer);
      entry.expiryTimer = undefined;
    }

    return () => {
      entry.refCount -= 1;
      if (entry.refCount === 0) {
        armExpiry(key, entry);
        evictSurplusIdleEntries();
      }
    };
    // args stecken bereits im Schlüssel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return useTracker(() => cache.get(key)?.handle.ready() ?? false, [key]);
}

/** Nur für Tests: sämtliche Abonnements sofort beenden. */
export function clearSubscriptionCache(): void {
  for (const key of Array.from(cache.keys())) {
    stopAndDelete(key);
  }
}

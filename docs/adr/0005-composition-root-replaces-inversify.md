# Composition Root statt InversifyJS

Status: accepted (2026-06-10)

## Kontext

Der Server nutzte InversifyJS 2.0.1 (2017) als DI-Container. Die Bindung lief
über Konstruktor-**Parameter-Decorators** (`@inject(...) @named(...)`) — eine
TypeScript-only-Syntax, die Babel nicht kompilieren kann. Das blockierte die
Migration auf Meteors `typescript`-Package (Babel-basiert) und zementierte die
tsc-Emit-Pipeline (`npm run compile` nach jedem Edit, sonst läuft alter Code).

Geprüfte Alternativen: inversify 7 und tsyringe (beide weiterhin
Parameter-Decorators — lösen das Problem nicht), awilix (decorator-frei, aber
Auflösung über Parameter-Namen bzw. Cradle-Proxy), typed-inject (decorator-frei,
`static inject`-Arrays).

## Entscheidung

**Kein DI-Framework.** Der Service-Graph (19 Server-Klassen, 5 Collections,
zwei Per-Request-Factories) wird in einer handgeschriebenen Composition Root
verdrahtet: `server/services.ts` exportiert `buildServices(collections,
emailSender, overrides)`. Produktion (`server/App.ts`) übergibt die echten
Meteor-Collections; die Unit-Tests bauen denselben Graph gegen
In-Memory-Collections und tauschen einzelne Kollaborateure über das
`overrides`-Objekt (ersetzt `kernel.unbind/bind`).

## Konsequenzen

- Keine Decorators, kein `reflect-metadata`, keine Laufzeit-Magie: der Graph
  ist eine lesbare Funktion, Fehlverdrahtung ist ein Compile-Fehler statt eines
  Laufzeit-Resolution-Fehlers.
- inversify, inversify-inject-decorators und reflect-metadata sind entfernt;
  `experimentalDecorators`/`emitDecoratorMetadata` sind aus der tsconfig raus.
- Der Weg zu Meteors `typescript`-Package ist frei.
- Trade-off: neue Services werden von Hand in `buildServices` eingetragen
  (eine Zeile) statt per `bind()`-Registrierung — bei dieser Graphgröße
  gewollt. Sollte der Graph stark wachsen, ist typed-inject der designierte
  Kandidat (decorator-frei, typsicher).
- Die alten Kernel-Symbole (`Types.*`) leben als Test-Identifier weiter
  (`tests/common/serviceSymbols.ts` mappt sie auf Service-Keys), damit die
  Testdateien unverändert bleiben.

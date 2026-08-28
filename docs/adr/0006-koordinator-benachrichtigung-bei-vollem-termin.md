# Koordinatoren werden über volle Termine benachrichtigt, nicht über Bewerbungen

Status: accepted (2026-08-28)

## Kontext

Jede Bewerbung auf einen Termin erzeugte eine In-App-Benachrichtigung und —
bei aktiviertem `notificationAsEmail` — eine E-Mail an alle Koordinatoren der
Gruppe. Bei Terminen mit Sollzahl 3 bedeutete das drei Mails für einen
einzigen handlungsrelevanten Moment. Der Koordinator kann ohnehin erst
handeln, wenn der Termin voll ist: dann bestätigt er die Bewerber und schließt
den Termin.

## Entscheidung

**Beide Kanäle werden umgestellt.** Eine einzelne Bewerbung löst nichts mehr
aus. Wird ein Termin voll — Bewerber plus Teilnehmer erreichen die Sollzahl,
Zustand `Online` —, erhalten die Koordinatoren eine In-App-Benachrichtigung
und (nach eigener Einstellung) eine E-Mail, die die zu bestätigenden Personen
namentlich auflistet. Nur Namen: die Mail ist ein Anstoß, keine Datenkopie,
und trägt keine Telefonnummern durch fremde Mailserver — Kontaktdaten stehen
hinter dem Link.

Der Übergang wird **ausschließlich an der Bewerbungsstelle** erkannt
(`server/methods.ts`, wo bisher `notifyCoordinatorsAboutApplication` stand),
durch Vergleich der Besetzung vor und nach der Bewerbung: vorher unter
Sollzahl, nachher auf oder über Sollzahl. Damit braucht es kein
Zustandsfeld am Termin.

`applicationNotifyMode` / `applicationNotifyDays` heißen jetzt
`fullNotifyMode` / `fullNotifyDays` und steuern dieselbe Abstufung (immer /
nur wenn der Termin in X Tagen beginnt / nie) für den neuen Anlass. Eine
einmalige Migration in `server/startup.ts` kopiert die Altwerte.

## Verworfene Alternativen

- **Periodischer Sweep** (Muster `AssignmentReminder` + `remindersSentAt`):
  hätte alle Wege in den vollen Zustand abgedeckt, kostet aber einen zweiten
  Scheduler, ein Stempelfeld und dessen Rücknahme-Regel. Für den mit Abstand
  häufigsten Weg — eine Bewerbung — ist der Vergleich an Ort und Stelle
  ausreichend.
- **Vierter Modus `whenFull` neben `all`/`nearOnly`/`none`**: hätte die
  beklagte Mailflut für alle bestehen lassen, die nichts umstellen.
- **Kontaktdaten in der Mail**: bequemer für unterwegs, verteilt aber die
  Mobilnummern von bis zu `userGoal` Personen dauerhaft in fremde Postfächer.

## Konsequenzen

- Bewusste Lücke: Wird ein Termin auf anderem Weg voll — Koordinator **senkt**
  die Sollzahl, teilt manuell einen Teilnehmer zu, oder reaktiviert einen
  abgesagten Termin, der schon genug Bewerber hat —, gibt es **keine**
  Benachrichtigung. Wer das ändern will, braucht den Sweep.
- Ein Termin kann mehrfach benachrichtigen: fällt er unter die Sollzahl
  (Rückzug) und wird erneut voll, geht erneut eine Nachricht raus. Das ist
  gewollt — der handlungsreife Zustand soll nie unbemerkt bleiben.
- Ohne Sollzahl (`userGoal` ist optional) wird ein Termin nie voll und löst nie
  eine Benachrichtigung aus.
- Ohne unbestätigte Bewerber entfällt die Nachricht ebenfalls: die Liste wäre
  leer und die Aufforderung gegenstandslos. In der Praxis tritt das kaum auf,
  da `AssignmentCloser` beim Schließen die Bewerberliste leert und den Zustand
  auf `Closed` setzt.
- Anders als bisher wird der auslösende Bewerber **nicht** mehr von der
  Empfängerliste ausgenommen. Bei der alten Nachricht war das sinnvoll —
  niemand muss über die eigene Bewerbung informiert werden. Dass ein Termin
  voll ist, betrifft einen Koordinator aber auch dann, wenn er selbst der
  letzte Bewerber war.
- `applicationEmail` in den Locales heißt jetzt `assignmentFullEmail` und trägt
  zusätzlich `toConfirm` als Überschrift über der Namensliste.

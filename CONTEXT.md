# jw-public

Organisiert das öffentliche Zeugnisgeben mit Schriftenständen: Gruppen legen
Termine an, Verkündiger bewerben sich darauf, Koordinatoren bestätigen die
Teilnehmer.

## Language

### Termine

**Termin**:
Ein zeitlich begrenzter Dienst an einem Schriftenstand, den eine Gruppe anlegt
und auf den sich Verkündiger bewerben.
_Avoid_: Einsatz, Schicht, Trolley, Trolleydienst, Trolleyschicht

**Sollzahl**:
Die vom Koordinator gewünschte Anzahl Personen für einen Termin (`userGoal`).
Ohne Sollzahl kann ein Termin nie voll werden.
_Avoid_: Zielgröße, Kapazität, Plätze

**Voller Termin**:
Ein offener Termin, bei dem Bewerber und Teilnehmer zusammen die Sollzahl
erreichen. In der Terminübersicht der Filter "Volle".
_Avoid_: ausgebucht, bestätigungsreif, readyForClose

**Offener Termin**:
Ein Termin, der weder geschlossen noch abgesagt ist (`state: Online`) — nur auf
ihn kann man sich bewerben.
_Avoid_: aktiver Termin, laufender Termin

**Geschlossener Termin**:
Ein Termin, dessen Teilnehmer der Koordinator endgültig bestätigt hat. Beim
Schließen wird die Bewerberliste geleert.
_Avoid_: fixierter Termin, bestätigter Termin

**Abgesagter Termin**:
Ein Termin, der mit Begründung abgesagt wurde und nicht stattfindet. Kann
wieder aktiviert werden.
_Avoid_: gelöschter Termin, stornierter Termin

### Personen

**Verkündiger**:
Ein Mitglied einer Gruppe, das sich auf Termine bewerben kann.
_Avoid_: Benutzer, Teilnehmer (solange nicht bestätigt)

**Bewerber**:
Ein Verkündiger, der sich auf einen Termin beworben hat und auf die Bestätigung
des Koordinators wartet.
_Avoid_: Interessent, Anwärter

**Teilnehmer**:
Ein Verkündiger, den der Koordinator für einen Termin bestätigt hat.
_Avoid_: Zugeteilter, Angenommener

**Koordinator**:
Verwaltet eine Gruppe: legt Termine an, bestätigt Bewerber, nimmt
Gruppenanfragen an.
_Avoid_: Gruppenleiter, Verantwortlicher, Admin

**Administrator**:
Verwaltet die Installation gruppenübergreifend (Benutzer, Gruppen, Aufräumen).
_Avoid_: Superuser, Betreiber

### Gruppen

**Gruppe**:
Die organisatorische Einheit, die Termine besitzt und Mitglieder hat.
_Avoid_: Versammlung, Team

**Gruppenanfrage**:
Der Wunsch eines Verkündigers, Mitglied einer Gruppe zu werden — vom
Koordinator anzunehmen oder abzulehnen.
_Avoid_: Bewerbung (das ist die Bewerbung auf einen Termin), Beitrittsantrag

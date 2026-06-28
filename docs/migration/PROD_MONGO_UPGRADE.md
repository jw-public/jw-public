# Produktions-Migration: MongoDB 3.6 → 7 + modernisierte App

Runbook für den Wechsel von der alten Produktion (vor-modernisierte App +
`mongo:3.6`) auf den modernisierten Stand (`master`) mit `mongo:7`.

## Warum Dump & Restore (kein In-Place-Upgrade)

- Die modernisierte App nutzt den MongoDB-Node-Treiber 6 (`npm-mongo@6.16`),
  der einen Server **≥ 4.0** verlangt. `mongo:3.6` lehnt die App-Verbindung ab.
- In-Place ginge nur sequenziell 3.6 → 4.0 → 4.2 → 4.4 → 5.0 → 6.0 → 7.0, jeweils
  mit `featureCompatibilityVersion`-Schritten (Prod steht sogar noch auf **FCV 3.4**).
- Die Datenbank ist **~18 MB** (536 User, 16 Gruppen, 50.679 Termine, 21.380
  Notifications). Bei der Größe ist **logisches Dump & Restore** in einen frischen
  `mongo:7` deutlich einfacher und sicherer — der neue Server startet sauber mit
  FCV 7.0, keine Stepping-Risiken.

## Lokal bereits validiert (docker-compose)

- `mongodump` (3.6, read-only) → `mongorestore` in `mongo:7`: 73.657 Dokumente,
  **0 Fehler**, alle Collection-Counts identisch.
- Modernisierte App gegen die echten Prod-Daten: bootet, `/status` → 200, die
  Startup-Rollen-Migration (alanning:roles v4) migriert die 2 Admin-User korrekt
  nach `role-assignment` und entfernt das Alt-`roles`-Feld; 536 User intakt.
- Kein User hat `termsOfUse` → das Consent-Gate erscheint nach der Migration bei
  jedem ersten Login (gewolltes Verhalten).

## Voraussetzungen

- `kubectl`-Kontext auf den Prod-Cluster, Namespace `jw-public`.
- Ein App-Release-Tag ist vorbereitet (`git tag v… && git push --tags` baut und
  publiziert `icereed/jw-public:latest`).
- Ein **off-cluster** Dump als Fallback (siehe Schritt 1).

## Migrationsschritte

> Schätzung: wenige Minuten Downtime. Während der Migration ist die App offline.

### 1. Finales Backup (Fallback)

```bash
POD=$(kubectl -n jw-public get pod -l app=mongo -o jsonpath='{.items[0].metadata.name}')
# App stoppen -> konsistenter Dump, keine in-flight writes
kubectl -n jw-public scale deploy/jw-public --replicas=0
kubectl -n jw-public exec "$POD" -- sh -c 'mongodump --db=jwpublic --gzip --archive=/tmp/jwpublic.archive'
kubectl -n jw-public cp "$POD:/tmp/jwpublic.archive" "./jwpublic-prod-$(date +%Y%m%d-%H%M%S).archive.gz"
kubectl -n jw-public exec "$POD" -- rm -f /tmp/jwpublic.archive
```

Das Archiv enthält **personenbezogene Daten** — sicher und lokal aufbewahren,
nicht ins Git/extern. (Zusätzlich existiert das stündliche S3-Backup.)

### 2. mongo:7 auf frischem Volume hochziehen

Die alte `mongo` PVC (3.6-Datendateien) bleibt **unangetastet** als Rollback.
`mongo-patch.yaml` zeigt jetzt auf die neue, leere **`mongo7`** PVC.

```bash
kubectl apply -k kubernetes/production   # legt mongo7-PVC an, mongo-Deployment -> mongo:7 (leer)
kubectl -n jw-public rollout status deploy/mongo
```

### 3. Dump in mongo:7 restoren

```bash
MPOD=$(kubectl -n jw-public get pod -l app=mongo -o jsonpath='{.items[0].metadata.name}')
kubectl -n jw-public cp "./jwpublic-prod-<TS>.archive.gz" "$MPOD:/tmp/dump.archive.gz"
kubectl -n jw-public exec "$MPOD" -- mongorestore --gzip --archive=/tmp/dump.archive.gz --drop
kubectl -n jw-public exec "$MPOD" -- mongosh jwpublic --quiet --eval \
  'db.getCollectionNames().forEach(c=>print(c+": "+db.getCollection(c).countDocuments({})))'
```

Counts gegen die Baseline prüfen (users 536, assignments 50679, …).

### 4. Neue App ausrollen

```bash
git tag vYYYY.MM && git push --tags   # publiziert icereed/jw-public:latest
kubectl -n jw-public set image deploy/jw-public jw-public=icereed/jw-public:latest
kubectl -n jw-public scale deploy/jw-public --replicas=1
kubectl -n jw-public rollout status deploy/jw-public
```

Hinweis: `--bind`/`MONGO_URL` enthält jetzt `?tls=false` (siehe `base/app.yaml`).

### 5. Validieren

```bash
kubectl -n jw-public logs deploy/jw-public | tail -20   # "Meteor started up", keine Fehler
kubectl -n jw-public exec deploy/mongo -- mongosh jwpublic --quiet --eval \
  'print("roles:", db.roles.countDocuments({}), " assignments:", db.assignments.countDocuments({}))'
```

- `https://jw-public.org/status` → 200
- Login eines Admins → Consent-Gate erscheint → nach Zustimmung Dashboard mit Daten.
- Backup-Job: `kubectl -n jw-public logs deploy/mongo-backup` (siehe Mongo-7-Hinweis unten).

### 6. Rollback (falls nötig)

```bash
kubectl -n jw-public scale deploy/jw-public --replicas=0
# mongo zurück auf alte 3.6-PVC: claimName mongo7 -> mongo und image mongo:7 -> mongo:3.6
#   (mongo-patch.yaml + base/mongodb.yaml temporär zurücksetzen) und altes App-Image setzen:
kubectl -n jw-public set image deploy/mongo mongo=mongo:3.6
kubectl -n jw-public set image deploy/jw-public jw-public=icereed/jw-public:<alter-tag>
kubectl -n jw-public scale deploy/jw-public --replicas=1
```

Die alte `mongo` PVC ist unverändert; ein Rollback verliert keine Daten (außer
nach der Migration in mongo:7 entstandene Schreibvorgänge).

### 7. Aufräumen (nach bestätigtem Erfolg)

- Alte `mongo` PVC löschen (gibt 50Gi frei).
- Backup-Job-Mongo-7-Kompatibilität bestätigen (siehe unten).

## Backup-Job & Mongo 7

`kubernetes/production/backup.yaml` bildet den **bestehenden** Job ab
(`icereed/mongodb-backup-s3`). Dessen gebündeltes `mongodump` **muss Server 7.0
unterstützen** — sonst brechen die Backups nach dem Upgrade still. Nach der
Migration prüfen: `kubectl -n jw-public logs deploy/mongo-backup`.

Falls die Tools zu alt sind, dieser native Ersatz (Mongo-7-`mongodump` +
`aws-cli`, keine Custom-Images):

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: mongo-backup
  namespace: jw-public
spec:
  schedule: "0 * * * *"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      backoffLimit: 2
      template:
        spec:
          restartPolicy: OnFailure
          volumes:
            - name: dump
              emptyDir: {}
          initContainers:
            - name: dump
              image: mongo:7 # bundles mongodump 100.x (server 3.6–7.0)
              command: ["/bin/bash", "-c"]
              args:
                - mongodump --host=mongo --port=27017 --db=jwpublic --gzip --archive=/dump/jwpublic.archive.gz
              volumeMounts:
                - { name: dump, mountPath: /dump }
          containers:
            - name: upload
              image: amazon/aws-cli:2
              command: ["/bin/sh", "-c"]
              args:
                - aws s3 cp /dump/jwpublic.archive.gz "s3://$BUCKET/jwpublic-$(date +%Y%m%d-%H%M%S).archive.gz"
              env:
                - { name: BUCKET, value: jw-public-backups }
                # TODO: Region des Buckets setzen (z. B. eu-central-1)
                - { name: AWS_DEFAULT_REGION, value: "<bucket-region>" }
                - name: AWS_ACCESS_KEY_ID
                  valueFrom: { secretKeyRef: { name: jw-public-aws, key: access-key-id } }
                - name: AWS_SECRET_ACCESS_KEY
                  valueFrom: { secretKeyRef: { name: jw-public-aws, key: secret-access-key } }
              volumeMounts:
                - { name: dump, mountPath: /dump }
```

## Weitere in dieser Migration behobene Drifts

- `production/ingress.yaml`: `extensions/v1beta1` → `networking.k8s.io/v1`
  (alte API ist seit k8s 1.22 entfernt).
- `production/backup.yaml`: war in `kustomization.yaml` referenziert, fehlte aber
  im Repo — jetzt ergänzt.
- `base/app.yaml`: `MONGO_URL` mit `?tls=false` (Treiber-/mongo:7-Quirk).

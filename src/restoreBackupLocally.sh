#! /bin/bash

docker run --rm --link meteor-db:backup-mongo -v "$(pwd)/backup":/backup mongo:3.2 mongorestore -h backup-mongo --drop /backup/dump
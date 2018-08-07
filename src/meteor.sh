#! /bin/bash

docker run --name meteor-db -d mongo:3.2
docker run -it --rm -p 10000:3000 --link meteor-db:db -e "MONGO_URL=mongodb://db/jwpublic" -v meteor-tmp:/root/.meteor:rw -v "$(pwd)":/app danieldent/meteor sh -c "meteor --allow-superuser $@"
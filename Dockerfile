FROM alpine:20260127 as prepare
COPY src/build/src.tar.gz /bundle/meteor.tar.gz
WORKDIR /tmp
RUN tar xvf /bundle/meteor.tar.gz

# Meteor 3.3 bundles target Node 22 — no fibers, no bcrypt rebuild hack.
FROM node:22
COPY --from=prepare /tmp/bundle /bundle

WORKDIR /bundle/programs/server/
RUN npm install

WORKDIR /bundle
CMD [ "node", "main.js" ]
EXPOSE 8080
ENV PORT 8080

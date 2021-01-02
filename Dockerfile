FROM abernix/meteord:node-12-base
COPY src/build/src.tar.gz /bundle/meteor.tar.gz
EXPOSE 8080
ENV PORT 8080

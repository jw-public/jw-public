FROM abernix/meteord:node-12-base
COPY src/build/src.tar.gz /bundle/meteor.tar.gz
EXPOSE 80
ENV PORT 80

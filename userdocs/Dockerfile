# hadolint ignore=DL3007
FROM melopt/mkdocs:latest as build
COPY . /src
WORKDIR /src
RUN mkdocs build --clean

FROM nginx:1.31.2-alpine
COPY --from=build /src/site /usr/share/nginx/html

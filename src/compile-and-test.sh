#! /bin/bash
docker-compose -f compile-and-test.docker-compose.yml down
docker-compose -f compile-and-test.docker-compose.yml up
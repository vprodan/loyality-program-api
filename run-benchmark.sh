#!/bin/sh

export ARCH=$(uname -m)
docker compose --profile benchmark up benchmark
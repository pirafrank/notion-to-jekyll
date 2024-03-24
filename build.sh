#!/usr/bin/env bash

TODAY=$(date +'%Y-%m-%d')

docker build \
  -t pirafrank/notion-to-jekyll:$TODAY \
  -t pirafrank/notion-to-jekyll:v1 \
  -f action.dockerfile .

docker push --all-tags pirafrank/notion-to-jekyll

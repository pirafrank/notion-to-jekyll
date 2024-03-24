#!/usr/bin/env bash

if [[ ! -z "${DEBUG_INFO}" ]]; then
  export
fi

if [[ "$DRY_RUN" == "true" ]]; then
  opts='--dry-run'
fi

node /app/app.js ${opts}

#!/usr/bin/env bash

if [[ ! -z "${DEBUG_INFO}" ]]; then
  export
fi

if [[ "$DRY_RUN" == "true" ]]; then
  opts='--dry-run'
fi

# replace any possibile // with /
export JEKYLL_ROOT=${JEKYLL_ROOT//\/\//\/}
# remove trailing /
export JEKYLL_ROOT=${JEKYLL_ROOT%/}

node /app/app.js ${opts}

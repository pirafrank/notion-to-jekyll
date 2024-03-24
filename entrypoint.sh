#!/usr/bin/env bash

# export all env vars from user input as env vars
# without the INPUT_ prefix put by GitHub Action context,
# and replace dashes with underscores.
# https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#inputs
for var in $(compgen -e | grep '^INPUT_'); do
  new_var_name="${var#INPUT_}"
  new_var_name="${new_var_name//-/_}"
  declare -x "$new_var_name=${!var}"
done

# override JEKYLL_ROOT to make it a relative path for user input
# workspace is mounted to /github/workspace by GitHub Action.
# https://docs.github.com/en/actions/creating-actions/creating-a-docker-container-action#accessing-files-created-by-a-container-action
export JEKYLL_ROOT="/github/workspace/${INPUT_JEKYLL_ROOT}"

if [[ "$DRY_RUN" == "true" ]]; then
  opts='--dry-run'
fi

if [[ ! -z "${INPUT_DEBUGINFO}" ]]; then
  export
fi

node /app/app.js ${opts}

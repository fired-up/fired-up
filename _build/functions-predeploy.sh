set -e

{
  node _build/functions-cleanup.js || exit 1
  node _build/functions-copy.js || exit 1

  ## Fixes a typescript issue where JSON files don't get copied to lib
  mkdir functions/lib/data && cp -r functions/src/data/* functions/lib/data
  mkdir functions/lib/config && cp -r functions/src/config/* functions/lib/config

  npm --prefix functions run build
  node _build/functions-packages.js
  node _build/functions-cleanup.js
  echo 'Fired Up Packages Glue - Success'
  exit 0
} || {
  # Reset Changes
  node _build/functions-cleanup.js
  echo 'Fired Up Packages Glue - Failure'
  exit 1
}

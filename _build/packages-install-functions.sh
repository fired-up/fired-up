set -e

{
  #node _build/functions-cleanup.js || exit 1

  cd packages

  for d in */ ; do
    echo $d"functions/package.json"
    if test -f $d"functions/package.json"; then
      echo "Installing packages for $d"
      cd $d"functions"
      yarn
      cd ../..
    fi
  done

  echo 'Fired Up Packages NPM install - Success'
  exit 0
} || {
  # Reset Changes
  node _build/functions-cleanup.js
  echo 'Fired Up Packages NPM install - Failure'
  exit 1
}

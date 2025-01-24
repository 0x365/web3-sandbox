#!/bin/bash

dev_script="npm run start"
build_script="npm run build"
test_script="npm run test"
lint_script="npm run lint"
serve_script="npm run serve"

# Check if node_modules directory exists
if [ ! -d "node_modules" ]; then
  echo "node_modules directory not found. Running npm install..."
  npm install
fi

# Check if node_modules directory exists
if [ ! -f ".env" ]; then
  echo "You need to add your API url in .env file first"
  cp setup/.env-template ./.env
  exit 1
fi


# Removes hashtags
find ./public/deployments -depth -name '*#*' -exec bash -c 'mv "$1" "${1//\#/}"' _ {} \;
node src/generateFileManifest.js


case "$1" in
  dev)
    echo "Executing: $dev_script"
    $dev_script
    ;;
  build)
    echo "Executing: $build_script"
    $build_script
    ;;
  test)
    echo "Executing: $test_script"
    $test_script
    ;;
  lint)
    echo "Executing: $lint_script"
    $lint_script
    ;;
  serve)
    echo "Executing: $serve_script"
    $serve_script
    ;;
  *)
    echo "Invalid argument. Use 'dev', 'build', 'test', 'lint', or 'serve'."
    exit 1
    ;;
esac

if [ $? -ne 0 ]; then
  echo "Error occurred while executing: $1"
  exit 1
fi

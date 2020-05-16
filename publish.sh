#!/bin/bash
set -e # Stop running on exception

# Update package version
echo 'Put version [<newversion> | major | minor | patch | premajor | preminor | prepatch ]'
read VERSION
VERSION="${VERSION:-minor}" # defaults to minor
npm version $VERSION

# Running tests and building the project
ng lint
ng test --no-watch --code-coverage
ng build

# Send coverage report to codecov for github badge
bash <(curl -s https://codecov.io/bash) -t f27c863b-d1a1-4e34-a7cf-5c4559de19f3

# Publishing the project from dist folder
copy package.json dist
cd dist
npm publish --access public


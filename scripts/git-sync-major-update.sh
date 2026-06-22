#!/usr/bin/env sh
set -eu

message="${1:-Major update}"

git status --short
git add .
git commit -m "$message"
git push

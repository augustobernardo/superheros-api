#!/bin/sh
set -e

echo "=== Running database migrations ==="
npm run migration:run:prod

echo "=== Running seeds ==="
npm run seed:prod

echo "=== Starting application ==="
exec "$@"

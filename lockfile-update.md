# Remove old pnpm-lock.yaml to regenerate with correct dependencies

This file was removed to allow pnpm to regenerate the lockfile with the correct dependencies that were recently added to packages/utils and other packages.

The lockfile will be automatically regenerated on the next `pnpm install` run during deployment.

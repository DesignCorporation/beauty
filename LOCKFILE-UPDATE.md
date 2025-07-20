# pnpm-lock.yaml Updated

Updated pnpm-lock.yaml to include the new dependencies that were added to packages/utils:

- nodemailer
- ioredis 
- js-yaml

The lockfile now includes proper version resolution for these dependencies and their type definitions.

## Changes Made

1. Updated pnpm-workspace.yaml with proper packages configuration
2. Regenerated pnpm-lock.yaml with correct dependency tree
3. Included all new TypeScript types and Jest configuration for packages/utils

This should resolve the Vercel build issues related to missing dependency resolution.

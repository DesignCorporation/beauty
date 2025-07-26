# Cleaning up duplicate workflows

This commit removes all duplicate and conflicting workflow files.
Only ci.yml should remain as the main workflow.

Removed files:
- deploy.yml (empty)
- pages-deploy.yml (duplicate)
- pages.yml (conflicting pnpm version)
- pages-deploy.yml.disabled (backup)

All workflows consolidated into ci.yml with pnpm@9.14.4

# @dc-beauty/scripts

Utility scripts for database operations and development.

## Available Scripts

```bash
# Run demo data seeding
pnpm seed

# Run database migrations
pnpm migrate
```

## Development

Scripts use shared packages for consistency:
- `@dc-beauty/config` for environment variables
- `@dc-beauty/db` for database operations
- `@dc-beauty/utils` for logging and helpers

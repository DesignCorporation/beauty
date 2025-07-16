import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000').transform(Number),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  TEST_DB_CONNECTION: z.string().default('false').transform(val => val === 'true'),
  OPENAI_API_KEY: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  SMTP_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);

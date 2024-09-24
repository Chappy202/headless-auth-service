import type { Config } from 'drizzle-kit';

export default {
  dialect: 'postgresql',
  schema: './src/infrastructure/database/schema.ts',
  out: './drizzle',
} satisfies Config;

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import * as schema from './schema';

// Configure Neon for serverless environments
neonConfig.fetchConnectionCache = true;

// Create connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Migration function for deployment
export async function runMigrations() {
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
}

// Connection type for TypeScript
export type Database = typeof db;

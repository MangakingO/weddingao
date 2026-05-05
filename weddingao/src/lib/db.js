import { neon } from '@neondatabase/serverless';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('No database connection string found. Set POSTGRES_URL or DATABASE_URL.');
}

export const sql = neon(connectionString);

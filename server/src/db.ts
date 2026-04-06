import pg from 'pg';

const pool = new pg.Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'fortidoc',
  user: process.env.PGUSER || 'fortidoc',
  password: process.env.PGPASSWORD || 'fortidoc',
});

export async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        hostname VARCHAR(255) DEFAULT 'FortiGate',
        model VARCHAR(100) DEFAULT 'FortiGate-60F',
        fortios_version VARCHAR(20) DEFAULT '7.4',
        config JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Database initialized');
  } finally {
    client.release();
  }
}

export default pool;

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function hashPins() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id, vendor_pin FROM outlets WHERE vendor_pin IS NOT NULL AND vendor_pin_hash IS NULL');
    for (const outlet of result.rows) {
      const hashed = await bcrypt.hash(outlet.vendor_pin, 10);
      await client.query('UPDATE outlets SET vendor_pin_hash = $1 WHERE id = $2', [hashed, outlet.id]);
      console.log(`Hashed PIN for outlet ${outlet.id}`);
    }
    console.log('Migration complete');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

hashPins();
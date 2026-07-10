const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("Connecting to the database...");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  console.log("Connected!");

  console.log("Reading raw SQL file...");
  const sql = fs.readFileSync(path.join(__dirname, 'create-tables.sql'), 'utf8');

  console.log("Executing table creation...");
  await client.query(sql);
  console.log("✅ Tables successfully created!");

  await client.end();
}

main().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});

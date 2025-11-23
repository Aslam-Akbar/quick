const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    const connection = await mysql.createConnection({
      host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: 'Bvm9FcvMXoWzkoK.root',
      password: 'i6mWwlCC3qq4na2f',
      database: 'QUICK',
      ssl: {
        minVersion: 'TLSv1.2',
        ca: fs.readFileSync(path.join(process.cwd(), 'isrgrootx1.pem')),
        rejectUnauthorized: true
      }
    });

    console.log('Connected to database.');

    // Add budget column
    const [budgetColumns] = await connection.query(`SHOW COLUMNS FROM projects LIKE 'budget'`);
    if (budgetColumns.length > 0) {
        console.log('Column budget already exists.');
    } else {
        await connection.query(`ALTER TABLE projects ADD COLUMN budget DECIMAL(15, 2) DEFAULT 0.00`);
        console.log('Added budget column to projects table.');
    }

    // Add currency column
    const [currencyColumns] = await connection.query(`SHOW COLUMNS FROM projects LIKE 'currency'`);
    if (currencyColumns.length > 0) {
        console.log('Column currency already exists.');
    } else {
        await connection.query(`ALTER TABLE projects ADD COLUMN currency VARCHAR(10) DEFAULT 'INR'`);
        console.log('Added currency column to projects table.');
    }

    await connection.end();
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();

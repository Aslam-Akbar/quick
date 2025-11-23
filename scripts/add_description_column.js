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

    // Check if column exists
    const [columns] = await connection.query(`SHOW COLUMNS FROM invoices LIKE 'description'`);
    if (columns.length > 0) {
        console.log('Column description already exists.');
    } else {
        await connection.query(`ALTER TABLE invoices ADD COLUMN description TEXT`);
        console.log('Added description column to invoices table.');
    }

    await connection.end();
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// SSL configuration - handle both local and Vercel environments
const getSSLConfig = () => {
  const certPath = path.join(process.cwd(), 'isrgrootx1.pem');
  
  // Check if certificate file exists (for local development)
  if (fs.existsSync(certPath)) {
    return {
      minVersion: 'TLSv1.2',
      ca: fs.readFileSync(certPath),
      rejectUnauthorized: true
    };
  }
  
  // For Vercel/production - use TLS without local certificate file
  return {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: false // TiDB Cloud has valid certificates
  };
};

export const pool = mysql.createPool({
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: 'Bvm9FcvMXoWzkoK.root',
  password: 'i6mWwlCC3qq4na2f',
  database: 'QUICK',
  ssl: getSSLConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

export async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error(`Database Error: ${error.message}`);
  }
}

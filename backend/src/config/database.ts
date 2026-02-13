import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig: sql.config = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_DATABASE || 'ShiftSyncDB',
  user: process.env.DB_USER || 'shiftsync_user',
  password: process.env.DB_PASSWORD || 'NewSecurePassword@2024!',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

export const sqlPool = new sql.ConnectionPool(dbConfig);

export const connectDatabase = async () => {
  try {
    await sqlPool.connect();
    console.log('Database connected successfully to ShiftSyncDB!');
    return sqlPool;
  } catch (err) {
    console.error('Database connection failed:', err);
    throw err;
  }
};

export default sql;

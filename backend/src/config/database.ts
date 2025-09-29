import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const sqlConfig: sql.config = {
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433'),
    database: process.env.DB_DATABASE || 'ShiftSyncDB',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    }
};

export const sqlPool = new sql.ConnectionPool(sqlConfig);
let poolConnect: Promise<sql.ConnectionPool>;

export const connectDatabase = async (): Promise<sql.ConnectionPool> => {
  if (!poolConnect) {
    poolConnect = sqlPool.connect();
    poolConnect.then(() => {
      console.log('✓ Database connected successfully!');
    }).catch(err => {
      console.error('❌ Database connection failed:', err);
      throw err;
    });
  }
  return poolConnect;
};

export { sql };
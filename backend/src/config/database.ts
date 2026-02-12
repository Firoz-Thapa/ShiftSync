import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'mysql',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'shiftsync',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
};

export const sqlPool = mysql.createPool(dbConfig);

export const connectDatabase = async () => {
  try {
    const connection = await sqlPool.getConnection();
    console.log('Database connected successfully!');
    connection.release();
    return sqlPool;
  } catch (err) {
    console.error('Database connection failed:', err);
    throw err;
  }
};

export default mysql;
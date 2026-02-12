import { sqlPool } from './database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

/**
 * MySQL query helper - provides a simple interface for executing queries
 * Similar to mssql's pool.request() pattern but for MySQL
 */
export class MySQLRequest {
  private _query: string = '';
  private params: any[] = [];
  private paramMap: Map<string, number> = new Map();
  private paramCounter: number = 0;

  query(queryStr: string): this {
    this._query = queryStr;
    this.params = [];
    this.paramMap.clear();
    this.paramCounter = 0;
    return this;
  }

  input(name: string, value: any): this {
    this.paramCounter++;
    this.paramMap.set(name, this.paramCounter);
    this.params.push(value);
    return this;
  }

  async execute() {
    try {
      // Replace @paramName with ? placeholders
      let finalQuery = this._query;
      const paramNames = Array.from(this.paramMap.keys()).sort(
        (a, b) => this.paramMap.get(b)! - this.paramMap.get(a)!
      );
      
      paramNames.forEach(name => {
        finalQuery = finalQuery.replace(new RegExp(`@${name}`, 'g'), '?');
      });

      const connection = await sqlPool.getConnection();
      try {
        const [rows] = await connection.execute<RowDataPacket[] | ResultSetHeader>(
          finalQuery, 
          this.params
        );
        
        const rowsAffected = Array.isArray(rows) 
          ? rows.length 
          : (rows as ResultSetHeader).affectedRows || 0;
        
        return {
          recordset: Array.isArray(rows) ? rows : [],
          rowsAffected: rowsAffected
        };
      } finally {
        connection.release();
      }
    } catch (error: any) {
      console.error('Query execution error:', error);
      throw error;
    }
  }
}

/**
 * Creates a MySQL request builder
 */
export function createRequest() {
  return new MySQLRequest();
}

/**
 * Get a direct connection from the pool
 */
export async function getConnection() {
  return await sqlPool.getConnection();
}
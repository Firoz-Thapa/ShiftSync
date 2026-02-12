import { sqlPool } from './database';

/**
 * MySQL query helper - provides a simple interface for executing queries
 * Similar to mssql's pool.request() pattern but for MySQL
 */
export class MySQLRequest {
  private query: string = '';
  private params: any[] = [];
  private paramMap: Map<string, number> = new Map();
  private paramCounter: number = 0;

  query(queryStr: string): this {
    this.query = queryStr;
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
      let finalQuery = this.query;
      const paramNames = Array.from(this.paramMap.keys()).sort(
        (a, b) => this.paramMap.get(b)! - this.paramMap.get(a)!
      );
      
      paramNames.forEach(name => {
        finalQuery = finalQuery.replace(new RegExp(`@${name}`, 'g'), '?');
      });

      const connection = await sqlPool.getConnection();
      try {
        const [rows] = await connection.execute(finalQuery, this.params);
        return {
          recordset: rows as any[],
          rowsAffected: Array.isArray(rows) ? rows.length : 0
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

import { sqlPool } from './database';
import sql from 'mssql';

export class MSSQLRequest {
  private _query: string = '';
  private request: sql.Request;

  constructor() {
    this.request = new sql.Request(sqlPool);
  }

  query(queryStr: string): this {
    this._query = queryStr;
    return this;
  }

  input(name: string, value: any): this {
    this.request.input(name, value);
    return this;
  }

  async execute() {
    try {
      const result = await this.request.query(this._query);
      return {
        recordset: result.recordset || [],
        rowsAffected: result.rowsAffected[0] || 0
      };
    } catch (error: any) {
      console.error('Query execution error:', error);
      throw error;
    }
  }
}

export function createRequest() {
  return new MSSQLRequest();
}
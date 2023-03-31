import { connect, type Connection } from '@planetscale/database';
import type { FriedaVars, RawTableColumnInfo, RawTableIndexInfo, RawTableInfo } from './types.js';
import sql, { raw } from 'sql-template-tag';

export const getConnection = (friedaVars: FriedaVars): Connection => {
  return connect({
    url: friedaVars.databaseUrl
  });
};

const getTableNames = async (connection: Connection) => {
  const query = sql`SHOW TABLES;`;
  const result = await connection.execute(query.sql);
  const tableNames: string[] = [];
  result.rows.forEach((row) => {
    const key: keyof typeof row = Object.keys(row)[0] as keyof typeof row;
    if (key && typeof row[key] === 'string') {
      tableNames.push(row[key]);
    }
  });
  return tableNames;
};



const getTableCreateSql = async (
  connection: Connection,
  tableName: string
): Promise<string> => {
  const query = sql`SHOW CREATE TABLE ${raw(tableName)};`;
  const result = await connection.execute(query.sql);
  const row = result.rows[0] as { Table: string; 'Create Table': string };
  return row['Create Table'] + ';';
};

const getTableColumnsInfo = async (
  connection: Connection,
  tableName: string
): Promise<RawTableColumnInfo[]> => {
  const query = sql`SHOW FULL COLUMNS FROM ${raw(tableName)};`;
  const result = await connection.execute(query.sql);
  return result.rows as RawTableColumnInfo[];
};

const getTableIndexesInfo = async (
  connection: Connection,
  tableName: string
): Promise<RawTableIndexInfo[]> => {
  const query = sql`SHOW INDEXES FROM ${raw(tableName)};`;
  const result = await connection.execute(query.sql);
  return result.rows as RawTableIndexInfo[];
};

const getTableInfo = async (
  connection: Connection,
  tableName: string
): Promise<RawTableInfo> => {
  const [tableCreateStatement, columns, indexes] = await Promise.all([
    getTableCreateSql(connection, tableName),
    getTableColumnsInfo(connection, tableName),
    getTableIndexesInfo(connection, tableName)
  ]);
  return {
    name: tableName,
    tableCreateStatement,
    columns,
    indexes
  };
};

export const getSchema = async (connection: Connection): Promise<RawTableInfo[]> => {
  const tableNames = await getTableNames(connection);
  const results = await Promise.all(
    tableNames.map((tableName) => getTableInfo(connection, tableName))
  );
  return results;
};

import { log, spinner } from '@clack/prompts';
import type { Connection } from '@planetscale/database';
import { createConnection, type Connection as MysqlConnection } from 'mysql2/promise'
import colors from 'picocolors';
import {relative} from 'path'
import { getCurrentMigrationsFilePath, getMigrationsFolderPath } from './files.js';
import type { FriedaVars } from './types.js';
import fs from 'fs-extra'
import { join, dirname } from 'path';
import { introspect } from './introspect.js';
export const runMigrations = async (
  friedaVars: FriedaVars,
  connection: Connection
): Promise<void> => {

  const readSpinner = spinner();
  readSpinner.start('Reading migration file...');
  const currMigrationsPath = getCurrentMigrationsFilePath(friedaVars);
  
  const { readFile, exists, ensureDir, writeFile } = fs;
  const currMigrationsExists = await exists(currMigrationsPath);
  if (! currMigrationsExists) {
    log.warn(`${colors.cyan(relative(process.cwd(), currMigrationsPath))} doen't exist.`)
    return;
  }
  const migrationSql = await readFile(currMigrationsPath, 'utf-8');
  if (migrationSql.trim().length === 0) {
    readSpinner.stop(colors.red('Error.'))
    log.error(`${colors.underline(colors.cyan(relative(process.cwd(), currMigrationsPath)))} is empty.`)
    return;
  }
  readSpinner.stop('Migration file read.');
  const connSpinner = spinner();
  connSpinner.start('Creating connection...')
  let mysqlConn: MysqlConnection|null = null;
  let ca: Buffer|null = null;
  try {
    ca = await readFile('/etc/ssl/cert.pem')
  } catch (error) {
    connSpinner.stop(colors.red('Error.'))
    log.error(`${colors.underline(colors.cyan('/etc/ssl/cert.pem'))} does not exist.`)
    return;
  }
  try {
    mysqlConn = await createConnection({
      uri: friedaVars.databaseUrl,
      ssl: {
        ca: ca as Buffer
      }
    });
  } catch (error) {
    connSpinner.stop(colors.red('Error.'))
    log.error(`A database connection could not be created. ${error}`)
    return;
  }
  connSpinner.stop('Connection created.');
  const querySpinner = spinner();
  querySpinner.start('Executing migration...')
  try {    
    await mysqlConn.execute(migrationSql);
    await mysqlConn.end();
    querySpinner.stop(colors.green('Success.'))
  } catch (error) {
    await mysqlConn.end();
    querySpinner.stop(colors.red('Error.'))
    log.error(`Execution failed. ${error}`)
    return;
  }

  const archiveSpinner = spinner();
  archiveSpinner.start('Archiving migration...');
  const now = new Date();
  const archivePath = join(getMigrationsFolderPath(friedaVars), 'archived', `migration-${now.toISOString()}.sql`)
  await ensureDir(dirname(archivePath))
  await writeFile(archivePath, `-- Migration completed ${now.toUTCString()}\n\n${migrationSql}`);
  await writeFile(currMigrationsPath, '');
  archiveSpinner.stop(`Migration archived at ${colors.underline(colors.cyan(relative(process.cwd(), archivePath)))}.`)
  log.info(`${colors.underline(colors.cyan(relative(process.cwd(), currMigrationsPath)))} reset.`)
  await introspect(friedaVars, connection);
}
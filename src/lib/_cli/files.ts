import type { FriedaVars } from './types';
import { join } from 'path';

export const RC_FILE_NAME = '.friedarc';
export const CURRENT_MIGRATIONS_FILE_NAME = '+current-migrations.sql';

export const getRcPath = () => {
  return join(process.cwd(), RC_FILE_NAME);
};

export const getMigrationsFolderPath = (friedaVars: FriedaVars) => {
  return join(process.cwd(), friedaVars.migrationsDirectory)
}

export const getCurrentMigrationsFilePath = (friedaVars: FriedaVars) => {
  return join(getMigrationsFolderPath(friedaVars), CURRENT_MIGRATIONS_FILE_NAME);
};

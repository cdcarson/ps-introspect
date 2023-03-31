import type { FriedaVars, RawTableInfo } from './types.js';
import type { Connection } from '@planetscale/database';
import { getSchema } from './db.js';
import {
  spinner,

} from '@clack/prompts';
import colors from 'picocolors';

import { join, dirname, relative } from 'path';
import fs from 'fs-extra';

export const introspect = async (
  friedaVars: FriedaVars,
  connection: Connection
): Promise<RawTableInfo[]> => {
  const s = spinner();
  s.start('Introspecting database...')
  const schema = await getSchema(connection)
  const tbsSql = schema.map(o => `-- ${o.name}\n${o.tableCreateStatement}`).join('\n\n');
  const fileDate = new Date();
  const fileName = `introspection.sql`;
  const filePath = join(process.cwd(), friedaVars.migrationsDirectory, fileName)
  
  const header = `-- Introspected at ${fileDate.toUTCString()}`;
  const contents = [header, tbsSql].join('\n\n');
  const { writeFile, ensureDir } = fs;
  await ensureDir(dirname(filePath));
  await writeFile(filePath, contents);
  s.stop(`Introspected: ${colors.underline(colors.cyan(relative(process.cwd(), filePath)))}`);
 
  return schema;
};

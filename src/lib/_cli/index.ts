#! /usr/bin/env node
import { intro, select, isCancel, cancel, outro } from '@clack/prompts';

import color from 'picocolors';
import { createModels } from './create-models.js';
import { getConnection } from './db.js';
import { getVariables } from './get-variables.js';
import { introspect } from './introspect.js';
import { runMigrations } from './run-migrations.js';

export const main = async () => {
  intro(color.yellow('Frieda'));
  const command = await select({
    message: 'What do you want to do?',
    options: [
      { label: 'Introspect database', value: 'introspect' },
      { label: 'Run migrations', value: 'runMigrations' },
      { label: 'Create models', value: 'createModels' }
    ]
  });
  if (isCancel(command)) {
    cancel('Operation cancelled.');
    return;
  }
  const friedaVars = await getVariables();
  if (friedaVars) {
    const connection = getConnection(friedaVars);

    switch (command) {
      case 'introspect':
        await introspect(friedaVars, connection);
        break;
      case 'runMigrations':
        await runMigrations(friedaVars, connection);
        break;
      case 'createModels':
        await createModels(friedaVars, connection);
        break;
    }

    outro(`Done.`);
  } else {
    cancel('Operation cancelled.');
    return;
  }
};

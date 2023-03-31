import {
  spinner,
  text,
  isCancel,
  confirm,
  log,
  password
} from '@clack/prompts';
import { config } from 'dotenv';
import fs from 'fs-extra';
import type { FriedaVars, FriedaRcVars } from './types.js';
import { getCurrentMigrationsFilePath, getRcPath, RC_FILE_NAME } from './files.js';
import colors from 'picocolors';
import { validateNonEmptyString } from './validation.js';
import {relative} from 'path'

export const getVariables = async (): Promise<FriedaVars | null> => {
  const { readJSON, exists, writeJSON, ensureFile } = fs;
  const reading = spinner();
  const rcFileNameFmted = colors.underline(colors.cyan(RC_FILE_NAME));
  reading.start('Reading variables...');
  const { parsed: envConfig } = config();
  const rcPath = getRcPath();
  const friedaVars: FriedaVars = {
    generatedModelsDirectory: '',
    migrationsDirectory: '',
    databaseUrl: ''
  };
  const rcExists: boolean = await exists(rcPath);
  if (rcExists) {
    try {
      const json: Partial<FriedaRcVars> = await readJSON(rcPath);
      friedaVars.generatedModelsDirectory = (
        json.generatedModelsDirectory || ''
      ).trim();
      friedaVars.migrationsDirectory = (json.migrationsDirectory || '').trim();
    } catch (error) {
      // ignore
    }
  }
  reading.stop(rcFileNameFmted + (rcExists ? ` found.` : ' not found.'));
  const offerToRewrite =
    friedaVars.migrationsDirectory.length === 0 ||
    friedaVars.generatedModelsDirectory.length === 0;

  if (friedaVars.migrationsDirectory.length === 0) {
    const migrationsDirectory = await text({
      message: `Migrations folder (Example: ${colors.cyan('migrations')}):`,
      placeholder: `Relative path`,
      validate: validateNonEmptyString
    });
    if (isCancel(migrationsDirectory)) {
      return null;
    }
    friedaVars.migrationsDirectory = migrationsDirectory;
  }
  if (friedaVars.generatedModelsDirectory.length === 0) {
    const generatedModelsDirectory = await text({
      message: `Generated models folder (Example: ${colors.cyan(
        'src/db/_generated'
      )}):`,
      placeholder: `Relative path`,
      validate: validateNonEmptyString
    });
    if (isCancel(generatedModelsDirectory)) {
      return null;
    }
    friedaVars.generatedModelsDirectory = generatedModelsDirectory;
  }
  if (offerToRewrite) {
    const prompt = rcExists
      ? `Save these settings to `
      : 'Update these settings in ' + `${rcFileNameFmted}?`;
    const rewriteRc = await confirm({
      message: prompt
    });
    if (isCancel(rewriteRc)) {
      return null;
    }
    if (rewriteRc) {
      const rewriteSpinner = spinner();
      rewriteSpinner.start(`Saving ${rcFileNameFmted}...`);
      await writeJSON(
        rcPath,
        {
          generatedModelsDirectory: friedaVars.generatedModelsDirectory,
          migrationsDirectory: friedaVars.migrationsDirectory
        },
        { spaces: 2 }
      );
      rewriteSpinner.stop(`Saved ${rcFileNameFmted}.`);
    }
  }
  let foundDbUrlVar: string | null = null;
  if (envConfig) {
    if (
      typeof envConfig.FRIEDA_DATABASE_URL === 'string' &&
      isValidURL(envConfig.FRIEDA_DATABASE_URL)
    ) {
      foundDbUrlVar = 'FRIEDA_DATABASE_URL';
      friedaVars.databaseUrl = envConfig.FRIEDA_DATABASE_URL;
    } else if (
      typeof envConfig.DATABASE_URL === 'string' &&
      isValidURL(envConfig.DATABASE_URL)
    ) {
      foundDbUrlVar = 'DATABASE_URL';
      friedaVars.databaseUrl = envConfig.DATABASE_URL;
    }
  }
  if (friedaVars.databaseUrl.length === 0) {
    const databaseUrl = await password({
      message: `Database URL (Example: ${colors.cyan(
        'mysql://user:pass@host'
      )}):`,
      validate: (val) => {
        if (! isValidURL(val)) {
          return 'Invalid database URL.'
        }
      }
    });
    if (isCancel(databaseUrl)) {
      return null;
    }
    friedaVars.databaseUrl = databaseUrl;
    log.info(
      `Note: You can skip answering this in future by adding either ${colors.gray(
        'DATABASE_URL'
      )} or ${colors.gray('FRIEDA_DATABASE_URL')} to ${colors.underline(
        colors.cyan('.env')
      )}`
    );
  }

  const currMigrationsSpinner = spinner();
  const currMigrationsFilePath = getCurrentMigrationsFilePath(friedaVars)
  currMigrationsSpinner.start(`Checking ${currMigrationsFilePath}...`);
  const currMigrationFileExists = await exists(currMigrationsFilePath);
  if (! currMigrationFileExists) {
    await ensureFile(currMigrationsFilePath);
    currMigrationsSpinner.stop(`Created ${colors.underline(colors.cyan(relative(process.cwd(), currMigrationsFilePath)))}`)
  } else {
    currMigrationsSpinner.stop(`${colors.underline(colors.cyan(relative(process.cwd(), currMigrationsFilePath)))} exists.`)
  }

  log.info(
    `Migrations folder: ${colors.green(friedaVars.migrationsDirectory)}`
  );
  log.info(
    `Generated models folder: ${colors.green(
      friedaVars.generatedModelsDirectory
    )}`
  );
  log.info(
    `Database URL: ${colors.green(
      replacePassword(friedaVars.databaseUrl)
    )} ${colors.gray(foundDbUrlVar ? '[env.' + foundDbUrlVar + ']' : '')}`
  );
  return friedaVars;
};

const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

const replacePassword = (urlStr: string): string => {
  const url = new URL(urlStr);
  const savedProtocol = url.protocol;
  url.protocol = 'http:';
  url.password = '<PASSWORD>';
  url.protocol = savedProtocol;
  return url.href.replace('%3CPASSWORD%3E', '<PASSWORD>');
};

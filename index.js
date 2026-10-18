const fs = require('node:fs');
const path = require('node:path');
const async = require('async');
const { format } = require('node:util');
const debug = require('debug')('marv:pg-driver');

const supportedDirectives = ['audit', 'comment', 'skip'];
const pkg = require('./package.json');

module.exports = (options) => {
  const { logger = console, ...rest } = options;
  const config = { table: 'migrations', ...rest, connection: { ...rest.connection } };
  const SQL = {
    ensureMigrationsTables: load('ensure-migrations-tables.sql'),
    checkNamespaceColumn: load('check-namespace-column.sql'),
    addNamespaceColumn: load('add-namespace-column.sql'),
    retrieveMigrations: load('retrieve-migrations.sql'),
    dropMigrationsTables: load('drop-migrations-tables.sql'),
    lockMigrationsLockTable: load('lock-migrations-lock-table.sql'),
    unlockMigrationsLockTable: load('unlock-migrations-lock-table.sql'),
    acquireLock: load('acquire-lock.sql'),
    releaseLock: load('release-lock.sql'),
    insertMigration: load('insert-migration.sql'),
  };
  const pg = config.pg || require('pg');
  let lockClient;
  let migrationClient;
  let userClient;

  function connect(cb) {
    lockClient = new pg.Client(config.connection);
    migrationClient = new pg.Client(config.connection);
    userClient = new pg.Client(config.connection);
    debug('Connecting to %s', getLoggableUrl());

    async.series(
      [
        lockClient.connect.bind(lockClient),
        migrationClient.connect.bind(migrationClient),
        userClient.connect.bind(userClient),
      ],
      guard(cb)
    );
  }

  function disconnect(cb) {
    debug('Disconnecting from %s', getLoggableUrl());
    async.series(
      [lockClient.end.bind(lockClient), migrationClient.end.bind(migrationClient), userClient.end.bind(userClient)],
      guard(cb)
    );
  }

  function dropMigrations(cb) {
    migrationClient.query(SQL.dropMigrationsTables, guard(cb));
  }

  function ensureMigrations(cb) {
    debug('Ensure migrations');
    async.series(
      [
        ensureMigrationsTables.bind(null, true),
        lockMigrations,
        migrationClient.query.bind(migrationClient, SQL.checkNamespaceColumn),
      ],
      ensureNamespace
    );

    function ensureMigrationsTables(firstRun, cb) {
      migrationClient.query(SQL.ensureMigrationsTables, (err) => {
        if (firstRun && err && err.code === '23505') {
          debug('Possible race condition when creating migration tables - retrying.');
          setTimeout(ensureMigrationsTables.bind(null, false, cb), 100);
        } else {
          cb(err);
        }
      });
    }

    function ensureNamespace(err, results) {
      if (err) return cb(err);
      const steps = [];
      if (results.at(-1).rows.length === 0) {
        debug('Adding namespace column');
        steps.push(migrationClient.query.bind(migrationClient, SQL.addNamespaceColumn));
      }
      steps.push(unlockMigrations);

      async.series(steps, guard(cb));
    }
  }

  function lockMigrations(cb) {
    lockClient.query(SQL.lockMigrationsLockTable, guard(cb));
  }

  function unlockMigrations(cb) {
    lockClient.query(SQL.unlockMigrationsLockTable, guard(cb));
  }

  function getMigrations(cb) {
    migrationClient.query(SQL.retrieveMigrations, (err, result) => {
      if (err) return cb(err);
      cb(null, result.rows);
    });
  }

  function runMigration(migration, cb) {
    debug('Run migration');

    migration.directives ??= {};

    checkDirectives(migration.directives);

    if (/^true$/i.test(migration.directives.skip)) {
      debug('Skipping migration %s: %s\n%s', migration.level, migration.comment, migration.script);
      return cb();
    }

    debug('Run migration %s: %s\n%s', migration.level, migration.comment, migration.script);
    userClient.query(migration.script, (err) => {
      if (err) return cb(decorate(err, migration));
      if (auditable(migration)) {
        return migrationClient.query(
          SQL.insertMigration,
          [
            migration.level,
            migration.directives.comment || migration.comment,
            migration.timestamp,
            migration.checksum,
            migration.namespace || 'default',
          ],
          (err) => {
            if (err) return cb(decorate(err, migration));
            cb();
          }
        );
      }
      cb();
    });
  }

  function checkDirectives(directives) {
    const unsupportedDirectives = Object.keys(directives).filter((key) => !supportedDirectives.includes(key));
    if (unsupportedDirectives.length === 0) return;
    if (!config.quiet) {
      logger.warn('Ignoring unsupported directives: %s. Try upgrading %s.', unsupportedDirectives, pkg.name);
    }
  }

  function auditable(migration) {
    return !/^false$/i.test(migration.directives.audit);
  }

  function getLoggableUrl() {
    return format(
      'postgres://%s:%s@%s:%s/%s',
      userClient.connectionParameters.user,
      '******',
      userClient.connectionParameters.host,
      userClient.connectionParameters.port,
      userClient.connectionParameters.database
    );
  }

  function load(filename) {
    return fs.readFileSync(path.join(__dirname, 'sql', filename), 'utf-8').replace(/migrations/g, config.table);
  }

  function guard(cb) {
    return (err) => {
      cb(err);
    };
  }

  function decorate(err, migration) {
    return Object.assign(err, { migration });
  }

  return {
    connect,
    disconnect,
    dropMigrations,
    ensureMigrations,
    lockMigrations,
    unlockMigrations,
    getMigrations,
    runMigration,
  };
};

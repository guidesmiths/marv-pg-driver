var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var async = require('async');
var format = require('util').format;
var debug = require('debug')('marv:pg-driver');
var supportedDirectives = ['audit', 'comment', 'skip'];
var pkg = require('./package.json');

module.exports = function (options) {
  var config = _.merge({ table: 'migrations', connection: {} }, _.omit(options, 'logger'));
  var logger = options.logger || console;
  var SQL = {
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
  var pg = config.pg || require('pg');
  var lockClient;
  var migrationClient;
  var userClient;

  function connect(cb) {
    lockClient = new pg.Client(config.connection);
    migrationClient = new pg.Client(config.connection);
    userClient = new pg.Client(config.connection);
    debug('Connecting to %s', getLoggableUrl());

    // prettier-ignore
    async.series([
      lockClient.connect.bind(lockClient),
      migrationClient.connect.bind(migrationClient),
      userClient.connect.bind(userClient)
    ], guard(cb));
  }

  function disconnect(cb) {
    debug('Disconnecting from %s', getLoggableUrl());
    // prettier-ignore
    async.series([
      lockClient.end.bind(lockClient),
      migrationClient.end.bind(migrationClient),
      userClient.end.bind(userClient)
    ],guard(cb));
  }

  function dropMigrations(cb) {
    migrationClient.query(SQL.dropMigrationsTables, guard(cb));
  }

  function ensureMigrations(cb) {
    debug('Ensure migrations');
    // prettier-ignore
    async.series([
      ensureMigrationsTables.bind(null, true),
      lockMigrations,
      migrationClient.query.bind(migrationClient, SQL.checkNamespaceColumn)
    ], ensureNamespace);

    function ensureMigrationsTables(firstRun, cb) {
      migrationClient.query(SQL.ensureMigrationsTables, function (err) {
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
      var steps = [];
      if (_.last(results).rows.length === 0) {
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
    migrationClient.query(SQL.retrieveMigrations, function (err, result) {
      if (err) return cb(err);
      cb(null, result.rows);
    });
  }

  function runMigration(migration, cb) {
    debug('Run migration');

    _.defaults(migration, { directives: {} });

    checkDirectives(migration.directives);

    if (/^true$/i.test(migration.directives.skip)) {
      debug('Skipping migration %s: %s\n%s', migration.level, migration.comment, migration.script);
      return cb();
    }

    debug('Run migration %s: %s\n%s', migration.level, migration.comment, migration.script);
    userClient.query(migration.script, function (err) {
      if (err) return cb(decorate(err, migration));
      if (auditable(migration)) {
        return migrationClient.query(SQL.insertMigration, [migration.level, migration.directives.comment || migration.comment, migration.timestamp, migration.checksum, migration.namespace || 'default'], function (err) {
          if (err) return cb(decorate(err, migration));
          cb();
        });
      }
      cb();
    });
  }

  function checkDirectives(directives) {
    var unsupportedDirectives = _.chain(directives).keys().difference(supportedDirectives).value();
    if (unsupportedDirectives.length === 0) return;
    if (!config.quiet) {
      logger.warn('Ignoring unsupported directives: %s. Try upgrading %s.', unsupportedDirectives, pkg.name);
    }
  }

  function auditable(migration) {
    if (migration.hasOwnProperty('directives')) return !/^false$/i.test(migration.directives.audit);
    if (migration.hasOwnProperty('audit')) {
      if (!config.quiet) logger.warn("The 'audit' option is deprecated. Please use 'directives.audit' instead.");
      return migration.audit !== false;
    }
    return true;
  }

  function getLoggableUrl() {
    return format('postgres://%s:%s@%s:%s/%s', userClient.connectionParameters.user, '******', userClient.connectionParameters.host, userClient.connectionParameters.port, userClient.connectionParameters.database);
  }

  function load(filename) {
    return fs.readFileSync(path.join(__dirname, 'sql', filename), 'utf-8').replace(/migrations/g, config.table);
  }

  function guard(cb) {
    return function (err) {
      cb(err);
    };
  }

  function decorate(err, migration) {
    return _.merge(err, { migration: migration });
  }

  return {
    connect: connect,
    disconnect: disconnect,
    dropMigrations: dropMigrations,
    ensureMigrations: ensureMigrations,
    lockMigrations: lockMigrations,
    unlockMigrations: unlockMigrations,
    getMigrations: getMigrations,
    runMigration: runMigration,
  };
};

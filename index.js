var fs = require('fs')
var path = require('path')
var _ = require('lodash')
var async = require('async')
var format = require('util').format
var debug = require('debug')('marv:pg-driver')

module.exports = function(_config) {

    var config = _.merge({ table: 'migrations', connection: {} }, _config)
    var SQL = {
        ensureMigrationsTable: load('ensure-migrations-table.sql'),
        retrieveMigrations: load('retrieve-migrations.sql'),
        dropMigrationsTable: load('drop-migrations-table.sql'),
        lockMigrationsTable: load('lock-migrations-table.sql'),
        unlockMigrationsTable: load('unlock-migrations-table.sql'),
        insertMigration: load('insert-migration.sql')
    }
    var pg = config.pg || require('pg')
    var auditClient
    var migrationClient

    function connect(cb) {
        auditClient = new pg.Client(config.connection)
        migrationClient = new pg.Client(config.connection)
        debug('Connecting to %s', getLoggableUrl())
        async.series([
            auditClient.connect.bind(auditClient),
            migrationClient.connect.bind(migrationClient)
        ], cb)
    }

    function disconnect(cb) {
        debug('Disconnecting from %s', getLoggableUrl())
        auditClient.end()
        migrationClient.end()
        cb()
    }

    function dropMigrations(cb) {
        auditClient.query(SQL.dropMigrationsTable, guard(cb))
    }

    function ensureMigrations(cb) {
        auditClient.query(SQL.ensureMigrationsTable, guard(cb))
    }

    function lockMigrations(cb) {
        auditClient.query(SQL.lockMigrationsTable, guard(cb))
    }

    function unlockMigrations(cb) {
        auditClient.query(SQL.unlockMigrationsTable, guard(cb))
    }

    function getMigrations(cb) {
        auditClient.query(SQL.retrieveMigrations, function(err, result) {
            if (err) return cb(err)
            cb(null, result.rows)
        })
    }

    function runMigration(migration, cb) {
        debug('Run migration %s: %s\n%s', migration.level, migration.comment, migration.script)
        migrationClient.query(migration.script, function(err) {
            if (err) return cb(err)
            auditClient.query(SQL.insertMigration, [migration.level, migration.comment, migration.timestamp, migration.checksum], guard(cb))
        })
    }

    function getLoggableUrl() {
        return format('postgres://%s:%s@%s:%s/%s', auditClient.connectionParameters.user, '******', auditClient.connectionParameters.host, auditClient.connectionParameters.port, auditClient.connectionParameters.database)
    }

    function load(filename) {
        return fs.readFileSync(path.join(__dirname, 'sql', filename), 'utf-8').replace(/migrations/g, config.table)
    }

    function guard(cb) {
        return function(err) {
            cb(err)
        }
    }

    return {
        connect: connect,
        disconnect: disconnect,
        dropMigrations: dropMigrations,
        ensureMigrations: ensureMigrations,
        lockMigrations: lockMigrations,
        unlockMigrations: unlockMigrations,
        getMigrations: getMigrations,
        runMigration: runMigration
    }
}

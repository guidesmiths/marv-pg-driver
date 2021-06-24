var Hath = require('hath');
var marv = require('marv');
var path = require('path');
var pg = require('pg');
var async = require('async');
var dropTables = require('./sql/drop-tables.sql');
var ensureLegacyMigrations = require('./sql/ensure-legacy-migrations-table.sql');
var checkNamespace = require('../sql/check-namespace-column.sql');

function shouldRunMigration(t, done) {
  const client = new pg.Client(t.locals.config.connection);
  client.connect(function(err) {
    if (err) throw err;
    client.query(dropTables, function(err) {
      if (err) throw err;
      marv.scan(path.join(__dirname, 'migrations'), function(err, migrations) {
        if (err) throw err;
        marv.migrate(migrations, t.locals.driver, function(err) {
          if (err) throw err;
          client.query('SELECT * FROM foo', function(err, result) {
            if (err) throw err;
            t.assertEquals(result.rows.length, 1);
            t.assertEquals(result.rows[0].id, 1);
            t.assertEquals(result.rows[0].value, 'foo');

            client.query('SELECT * FROM bar', function(err, result) {
              if (err) throw err;
              t.assertEquals(result.rows.length, 1);
              t.assertEquals(result.rows[0].id, 1);
              t.assertEquals(result.rows[0].value, 'bar');
              client.end();
              done();
            });
          });
        });
      });
    });
  });
}

function shouldEnsureNamespaceColumn(t, done) {
  const client = new pg.Client(t.locals.config.connection);
  client.connect(function(err) {
    if (err) throw err;
    async.series([
      client.query.bind(client, dropTables),
      client.query.bind(client, ensureLegacyMigrations)
    ], function (err) {
      if (err) throw err;
      marv.scan(path.join(__dirname, 'migrations'), function(err, migrations) {
        if (err) throw err;
        marv.migrate({}, t.locals.driver, function(err) {
          if (err) throw err;
          client.query(checkNamespace, function (err, result) {
            if (err) throw err;
            t.assertEquals(result.rows.length, 1);
            t.assertMatches(/^'default'/, result.rows[0].column_default);
            client.end();
            done();
          });
        });
      });
    });
  });
}

module.exports = Hath.suite('Driver Tests', [
  shouldRunMigration,
  shouldEnsureNamespaceColumn
]);

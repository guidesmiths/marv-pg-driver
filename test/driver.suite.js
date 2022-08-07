const { Suite, Test } = require('zunit');
const { strictEqual: eq, match } = require('assert');
const marv = require('marv');
const path = require('path');
const pg = require('pg');
const fs = require('fs');
const async = require('async');

const shouldRunMigration = new Test('should run migration', (t, done) => {
  const dropTables = load(t, ['sql', 'drop-tables.sql']);
  const client = new pg.Client(t.locals.get('config').connection);
  client.connect((err) => {
    if (err) throw err;
    client.query(dropTables, (err) => {
      if (err) throw err;
      marv.scan(path.join(__dirname, 'migrations'), (err, migrations) => {
        if (err) throw err;
        marv.migrate(migrations, t.locals.get('driver1'), (err) => {
          if (err) throw err;
          client.query('SELECT * FROM foo', (err, result) => {
            if (err) throw err;
            eq(result.rows.length, 1);
            eq(result.rows[0].id, 1);
            eq(result.rows[0].value, 'foo');

            client.query('SELECT * FROM bar', (err, result) => {
              if (err) throw err;
              eq(result.rows.length, 1);
              eq(result.rows[0].id, 1);
              eq(result.rows[0].value, 'bar');
              client.end();
              done();
            });
          });
        });
      });
    });
  });
});

const shouldEnsureNamespaceColumn = new Test('should ensure namespace column', (t, done) => {
  const dropTables = load(t, ['sql', 'drop-tables.sql']);
  const ensureLegacyMigrations = load(t, ['sql', 'ensure-legacy-migrations-table.sql']);
  const checkNamespace = load(t, ['..', 'sql', 'check-namespace-column.sql']);
  const client = new pg.Client(t.locals.get('config').connection);
  client.connect((err) => {
    if (err) throw err;
    async.series([client.query.bind(client, dropTables), client.query.bind(client, ensureLegacyMigrations)], (err) => {
      if (err) throw err;
      marv.scan(path.join(__dirname, 'migrations'), (err) => {
        if (err) throw err;
        marv.migrate({}, t.locals.get('driver1'), (err) => {
          if (err) throw err;
          client.query(checkNamespace, (err, result) => {
            if (err) throw err;
            eq(result.rows.length, 1);
            match(result.rows[0].column_default, /^'default'/);
            client.end();
            done();
          });
        });
      });
    });
  });
});

function load(t, location) {
  return fs
    .readFileSync(path.join.apply(null, [__dirname].concat(location)), 'utf-8')
    .replace(/migrations/g, t.locals.get('config').table);
}

module.exports = new Suite('Driver Tests').add(shouldRunMigration).add(shouldEnsureNamespaceColumn);

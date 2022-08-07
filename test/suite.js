var Hath = require('hath');
var complianceTests = require('marv-compliance-tests');
var driverTests = require('./driver-tests');
var driver = require('..');
var report = require('hath-report-spec');
require('hath-assert')(Hath);

function setup(t, done) {
  var config = {
    table: 'pg_migrations',
    quiet: true,
    connection: {
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: '',
    },
  };
  t.locals.config = config;
  t.locals.driver = driver(config);
  t.locals.driver2 = driver(config);
  t.locals.migrations = {
    simple: {
      level: 1,
      comment: 'test migration',
      script: 'SELECT 1',
      timestamp: new Date(),
      checksum: '401f1b790bf394cf6493425c1d7e33b0',
    },
    namespace: {
      level: 1,
      comment: 'test migration',
      script: 'SELECT 1',
      timestamp: new Date(),
      checksum: '401f1b790bf394cf6493425c1d7e33b0',
      namespace: 'so-special',
    },
    comment: {
      level: 2,
      comment: 'do not use',
      script: ['-- @MARV foo = bar\n', '-- @MARV COMMENT = override\n', 'SELECT 1'].join('\n'),
      timestamp: new Date(),
      checksum: '401f1b790bf394cf6493425c1d7e33b0',
    },
    audit: {
      level: 3,
      comment: 'test migration',
      script: ['-- @MARV foo = bar\n', '-- @MARV AUDIT   = false\n', 'SELECT 1'].join('\n'),
      timestamp: new Date(),
      checksum: '401f1b790bf394cf6493425c1d7e33b0',
    },
    skip: {
      level: 4,
      comment: 'test migration',
      script: ['-- @MARV foo = bar\n', '-- @MARV SKIP   = true\n', 'INVALID'].join('\n'),
      timestamp: new Date(),
      checksum: '401f1b790bf394cf6493425c1d7e33b0',
    },
    fail: {
      level: 5,
      comment: 'failing migration',
      script: 'INVALID',
      timestamp: new Date(),
      checksum: '401f1b790bf394cf6493425c1d7e33b0',
    },
  };
  t.locals.migration = t.locals.migrations.simple;
  done();
}

module.exports = Hath.suite('Postgres Driver Tests', [setup, complianceTests, driverTests]);

if (module === require.main) {
  module.exports(new Hath(report));
}

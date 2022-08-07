const { Suite, Hook } = require('zunit');
const complianceTestSuite = require('marv-compliance-tests');
const driverTestSuite = require('./driver.suite');
const driver = require('..');

const setup = new Hook('Setup', (hook) => {
  const config = {
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
  hook.suite.locals.set('config', config);
  hook.suite.locals.set('driver1', driver(config));
  hook.suite.locals.set('driver2', driver(config));
  hook.suite.locals.set('migrations', {
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
  });
  hook.suite.locals.set('migration', hook.suite.locals.get('migrations').simple);
});

module.exports = new Suite('All Tests').before(setup).add(complianceTestSuite).add(driverTestSuite);

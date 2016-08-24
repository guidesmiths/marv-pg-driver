var Hath = require('hath')
var complianceTests = require('marv-compliance-tests')
var driverTests = require('./driver-tests')
var driver = require('..')

function setup(t, done) {
    var config = {
        table: 'pg_migrations',
        connection: {
            host: 'localhost',
            port: 5432,
            database: 'postgres',
            user: 'postgres',
            password: ''
        }
    }
    t.locals.config = config
    t.locals.driver = driver(config)
    t.locals.driver2 = driver(config)
    t.locals.migration = {
        level: 1,
        comment: 'test migration',
        script: 'SELECT 1',
        timestamp: new Date(),
        checksum: '401f1b790bf394cf6493425c1d7e33b0'
    }
    done()
}

module.exports = Hath.suite('Postgres Driver Tests', [
    setup,
    complianceTests,
    driverTests
])

if (module === require.main) {
  module.exports(new Hath())
}
var Hath = require('hath')
var marv = require('marv')
var path = require('path')
var pg = require('pg')

function shouldRunMigration(t, done) {
    const client = new pg.Client(t.locals.config.connection)
    client.connect(function(err) {
        if (err) throw err
        client.query('DROP TABLE IF EXISTS pg_migrations; DROP TABLE IF EXISTS foo; DROP TABLE IF EXISTS bar;', function(err) {
            if (err) throw err
            marv.scan(path.join(__dirname, 'migrations'), function(err, migrations) {
                if (err) throw err
                marv.migrate(migrations, t.locals.driver, function(err) {
                    if (err) throw err
                    client.query('SELECT * FROM foo', function(err, result) {
                        if (err) throw err
                        t.assertEquals(result.rows.length, 1)
                        t.assertEquals(result.rows[0].id, 1)
                        t.assertEquals(result.rows[0].value, 'foo')

                        client.query('SELECT * FROM bar', function(err, result) {
                            if (err) throw err
                            t.assertEquals(result.rows.length, 1)
                            t.assertEquals(result.rows[0].id, 1)
                            t.assertEquals(result.rows[0].value, 'bar')
                            client.end()
                            done()
                        })
                    })
                })
            })
        })
    })
}

function shouldTraceMigrationError (t, done) {
    const client = new pg.Client(t.locals.config.connection)
    client.connect(function (err) {
        if (err) throw err
        client.query('DROP TABLE IF EXISTS pg_migrations; DROP TABLE IF EXISTS foo;', function (err) {
            if (err) throw err
            marv.scan(path.join(__dirname, 'migrations-force-err'), function (err, migrations) {
                if (err) throw err
                marv.migrate(migrations, t.locals.driver, function (err) {
                    if (err) {
                        t.assertEquals(err.migration.level, 1)
                        t.assertEquals(err.migration.comment, 'create foo table')
                    }
                    client.end()
                    done()
                })
            })
        })
    })
}

module.exports = Hath.suite('Driver Tests', [
    shouldRunMigration,
    shouldTraceMigrationError
])

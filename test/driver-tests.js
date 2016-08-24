var Hath = require('hath')
var marv = require('marv')
var path = require('path')
var pg = require('pg')

function shouldRunMigration(t, done) {
    const client = new pg.Client(t.locals.config.connection)
    client.connect(function(err) {
        if (err) throw err
        client.query('DROP TABLE pg_migrations; DROP TABLE foo; DROP TABLE bar;', function(err) {
            if (err) throw err
            marv.scan(path.join(__dirname, 'migrations'), function(err, migrations) {
                if (err) throw err
                marv.migrate(migrations, t.locals.driver, function(err) {
                    if (err) throw err
                    client.query('SELECT * FROM foo', function(err, result) {
                        if (err) throw err
                        t.assert(result.rows.length === 1, 'Row not inserted')
                        t.assert(result.rows[0].id === 1, 'Wrong id')
                        t.assert(result.rows[0].value === 'foo', 'Wrong value')

                        client.query('SELECT * FROM bar', function(err, result) {
                            if (err) throw err
                            t.assert(result.rows.length === 1, 'Row not inserted')
                            t.assert(result.rows[0].id === 1, 'Wrong id')
                            t.assert(result.rows[0].value === 'bar', 'Wrong value')
                            client.end()
                            done()
                        })
                    })
                })
            })
        })
    })
}

module.exports = Hath.suite('Driver Tests', [
    shouldRunMigration
])
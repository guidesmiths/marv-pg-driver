[![Build Status](https://img.shields.io/travis/guidesmiths/marv-pg-driver/master.svg)](https://travis-ci.org/guidesmiths/marv-pg-driver)
[![Code Style](https://img.shields.io/badge/code%20style-imperative-brightgreen.svg)](https://github.com/guidesmiths/eslint-config-imperative)
# marv-pg-driver
A postgres driver for [marv](https://www.npmjs.com/package/marv)

## Usage
```
migrations/
  |- 001.create-table.sql
  |- 002.create-another-table.sql
```

```js
const marv = require('marv')
const pgDriver = require('marv-pg-driver')
const directory = path.join(process.cwd(), 'migrations' )
const driver = pgDriver({
    table: 'db_migrations',     // defaults to 'migrations'
    connection: {               // the connection sub document is passed directly to pg.Client
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: ''
    }
})
marv.scan(directory, (err, migrations) => {
    if (err) throw err
    marv.migrate(migrations, driver, (err) => {
        if (err) throw err
    })
})
```

## Testing

```bash
# install dependencies
npm install # or yarn
# run docker container
npm run docker
# run tests
npm test
```

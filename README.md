[![NPM version](https://img.shields.io/npm/v/marv.svg?style=flat-square)](https://www.npmjs.com/package/marv)
[![NPM downloads](https://img.shields.io/npm/dm/marv.svg?style=flat-square)](https://www.npmjs.com/package/marv)
[![Build Status](https://img.shields.io/travis/guidesmiths/marv-pg-driver/master.svg)](https://travis-ci.org/guidesmiths/marv-pg-driver)
[![Code Climate](https://codeclimate.com/github/guidesmiths/marv-pg-driver/badges/gpa.svg)](https://codeclimate.com/github/guidesmiths/marv-pg-driver)
[![Test Coverage](https://codeclimate.com/github/guidesmiths/marv-pg-driver/badges/coverage.svg)](https://codeclimate.com/github/guidesmiths/marv-pg-driver/coverage)
[![Code Style](https://img.shields.io/badge/code%20style-imperative-brightgreen.svg)](https://github.com/guidesmiths/eslint-config-imperative)
[![Dependency Status](https://david-dm.org/guidesmiths/marv-pg-driver.svg)](https://david-dm.org/guidesmiths/marv-pg-driver)
[![devDependencies Status](https://david-dm.org/guidesmiths/marv-pg-driver/dev-status.svg)](https://david-dm.org/guidesmiths/marv-pg-driver?type=dev)

# marv-pg-driver
A postgres driver for [marv](https://www.npmjs.com/package/marv)

## Usage
```
migrations/
  |- 001.create-table.sql
  |- 002.create-another-table.sql
```

### Promises
```js
const marv = require('marv/api/promise'); // <-- Promise API
const driver = require('marv-pg-driver');
const directory = path.resolve('migrations');
const connection = {
  // Properties are passed straight pg.Client
  host: 'postgres.example.com',
};

const migrations = await marv.scan(directory);
await marv.migrate(migrations, driver({ connection });
// Profit :)
```


### Callbacks
```js
const marv = require('marv/api/callback'); // <-- Callback API
const driver = require('marv-pg-driver');
const directory = path.resolve('migrations');
const connection = {
  // Properties are passed straight pg.Client
  host: 'postgres.example.com',
};

marv.scan(directory, (err, migrations) => {
  if (err) throw err
  // Connection properties are passed straight pg.Client
  marv.migrate(migrations, driver({ connection }), (err) => {
    if (err) throw err
    // Profit :)
  })
})
```

## Testing
```bash
npm install
npm run docker
npm test
```

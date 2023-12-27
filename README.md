[![NPM version](https://img.shields.io/npm/v/marv-pg-driver.svg?style=flat-square)](https://www.npmjs.com/package/marv-pg-driver)
[![NPM downloads](https://img.shields.io/npm/dm/marv-pg-driver.svg?style=flat-square)](https://www.npmjs.com/package/marv-pg-driver)
[![Build Status](https://img.shields.io/travis/guidesmiths/marv-pg-driver/master.svg)](https://travis-ci.org/guidesmiths/marv-pg-driver)
[![Maintainability](https://api.codeclimate.com/v1/badges/f4f00937958b3ad25af5/maintainability)](https://codeclimate.com/github/cressie176/marv-pg-driver/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/f4f00937958b3ad25af5/test_coverage)](https://codeclimate.com/github/cressie176/marv-pg-driver/test_coverage)
[![Code Style](https://img.shields.io/badge/code%20style-prettier-brightgreen.svg)](https://github.com/prettier/prettier)

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
await marv.migrate(migrations, driver({ connection }));
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
  if (err) throw err;
  // Connection properties are passed straight pg.Client
  marv.migrate(migrations, driver({ connection }), (err) => {
    if (err) throw err;
    // Profit :)
  });
});
```

## Testing

```bash
npm install
npm run docker
npm test
```

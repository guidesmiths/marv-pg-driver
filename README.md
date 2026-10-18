[![NPM version](https://img.shields.io/npm/v/marv-pg-driver.svg?style=flat-square)](https://www.npmjs.com/package/marv-pg-driver)
[![NPM downloads](https://img.shields.io/npm/dm/marv-pg-driver.svg?style=flat-square)](https://www.npmjs.com/package/marv-pg-driver)
[![Node.js CI](https://github.com/guidesmiths/marv-pg-driver/actions/workflows/node-js-ci.yml/badge.svg)](https://github.com/guidesmiths/marv-pg-driver/actions/workflows/node-js-ci.yml)
[![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat-square&logo=biome)](https://biomejs.dev)

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

`npm run docker` starts PostgreSQL in a container named `marv-pg-driver-postgres`, listening on port 5435 to avoid clashing with any PostgreSQL instance already running on the default port.

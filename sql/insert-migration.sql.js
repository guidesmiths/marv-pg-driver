module.exports = `
  INSERT INTO "migrations"
    ("level", "comment", "timestamp", "checksum", "namespace")
  VALUES ($1, $2, $3, $4, $5);
`;

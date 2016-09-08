CREATE TABLE IF NOT EXISTS migrations (
    level INTEGER PRIMARY KEY,
    comment TEXT,
    "timestamp" TIMESTAMP WITH TIME ZONE,
    checksum TEXT
);

CREATE TABLE IF NOT EXISTS migrations_lock ();

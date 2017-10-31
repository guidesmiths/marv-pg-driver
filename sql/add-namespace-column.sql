ALTER TABLE migrations ADD COLUMN namespace TEXT DEFAULT 'default';
ALTER TABLE migrations DROP CONSTRAINT migrations_pkey;
ALTER TABLE migrations ADD PRIMARY KEY (level, namespace);

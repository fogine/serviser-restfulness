-- Deploy restfulness:movies to pg

BEGIN;

    CREATE TABLE movies (
        id SERIAL PRIMARY KEY,
        name character varying(32),
        description character varying(256),
        released_at timestamp with time zone NOT NULL,
        rating decimal,
    );

    ALTER TABLE ONLY movies ADD CONSTRAINT movies_name_key UNIQUE (name);

COMMIT;

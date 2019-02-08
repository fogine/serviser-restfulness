-- Deploy restfulness:users to pg

BEGIN;

    CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username character varying(32),
        password character varying(32),
        email character varying(32),
        subscribed boolean default false,
        created_at timestamp with time zone NOT NULL default current_timestamp,
        updated_at timestamp with time zone NOT NULL default current_timestamp
    );

    ALTER TABLE ONLY users ADD CONSTRAINT users__username__key UNIQUE (username);
    ALTER TABLE ONLY users ADD CONSTRAINT users__email__key UNIQUE (email);
COMMIT;

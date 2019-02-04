-- Deploy restfulness:countries to pg

BEGIN;

    CREATE TABLE countries (
        id SERIAL PRIMARY KEY,
        name character varying(32),
        code_2 character varying(2)
    );

    ALTER TABLE ONLY countries ADD CONSTRAINT countries_name_key UNIQUE (name);

COMMIT;

-- Deploy restfulness:user_details to pg

BEGIN;

    CREATE TABLE user_details (
        id SERIAL PRIMARY KEY,
        user_id integer,
        country character varying(3)
    );

    ALTER TABLE ONLY user_details ADD CONSTRAINT user_details__user_id__fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;

COMMIT;

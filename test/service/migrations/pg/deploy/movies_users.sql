-- Deploy restfulness:movies_users to pg

BEGIN;

    CREATE TABLE movies_users (
        id SERIAL PRIMARY KEY,
        movie_id integer,
        user_id integer
    );

    ALTER TABLE ONLY movies_users ADD CONSTRAINT movies_users__movie_id__fkey
        FOREIGN KEY (movie_id) REFERENCES movies(id) ON UPDATE CASCADE ON DELETE CASCADE;

    ALTER TABLE ONLY movies_users ADD CONSTRAINT movies_users__user_id__fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
COMMIT;

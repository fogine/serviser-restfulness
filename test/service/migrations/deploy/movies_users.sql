-- Deploy restfulness:movies_users to pg

BEGIN;

    CREATE TABLE movies_users (
        id SERIAL PRIMARY KEY,
        movie_id integer,
        user_id integer
    );

    ALTER TABLE ONLY movies_users ADD CONSTRAINT movies_users_movie_id_fkey
        FOREIGN KEY (movie_id) REFERENCES movie(id) ON UPDATE CASCADE ON DELETE CASCADE;

    ALTER TABLE ONLY movies_users ADD CONSTRAINT movies_users_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES user(id) ON UPDATE CASCADE ON DELETE CASCADE;
COMMIT;

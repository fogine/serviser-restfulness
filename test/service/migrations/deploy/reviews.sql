-- Deploy restfulness:reviews to pg

BEGIN;

    CREATE TABLE reviews (
        id SERIAL PRIMARY KEY,
        movie_id integer,
        user_id integer,
        stars integer not null,
        comment character varying(255)
    );

    ALTER TABLE ONLY reviews ADD CONSTRAINT reviews_movie_id_fkey
    FOREIGN KEY (movie_id) REFERENCES movie(id) ON UPDATE CASCADE ON DELETE CASCADE;

    ALTER TABLE ONLY reviews ADD CONSTRAINT reviews_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES user(id) ON UPDATE CASCADE ON DELETE CASCADE;

COMMIT;

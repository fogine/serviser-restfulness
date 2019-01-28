-- Deploy restfulness:movies_users to mysql

BEGIN;

    CREATE TABLE movies_users (
        id INT NOT NULL AUTO_INCREMENT,
        movie_id INT NOT NULL,
        user_id INT NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY (movie_id) REFERENCES movies(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

COMMIT;

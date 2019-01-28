-- Deploy restfulness:reviews to mysql

BEGIN;

    CREATE TABLE reviews (
        id INT NOT NULL AUTO_INCREMENT,
        movie_id INT,
        user_id INT,
        stars INT NOT NULL,
        comment varchar(255),
        PRIMARY KEY (id),
        FOREIGN KEY (movie_id) REFERENCES movies(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

COMMIT;

-- Deploy restfulness:movies to mysql

BEGIN;

    CREATE TABLE movies (
        id INT NOT NULL AUTO_INCREMENT,
        name varchar(32),
        description varchar(256),
        released_at datetime NOT NULL,
        rating decimal,
        PRIMARY KEY (id),
        CONSTRAINT movies_name_key UNIQUE(name)
    );

COMMIT;

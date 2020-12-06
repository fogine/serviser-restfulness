-- Deploy restfulness:user_details to mysql

BEGIN;

    CREATE TABLE user_details (
        id INT NOT NULL AUTO_INCREMENT,
        country VARCHAR(3),
        user_id INT NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

COMMIT;

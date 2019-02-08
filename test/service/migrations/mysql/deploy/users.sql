-- Deploy restfulness:users to mysql

BEGIN;

    CREATE TABLE users (
        id INT NOT NULL AUTO_INCREMENT,
        username VARCHAR(32),
        password VARCHAR(32),
        email VARCHAR(32),
        subscribed BOOLEAN DEFAULT false,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT users__username__key UNIQUE(username),
        CONSTRAINT users__email__key UNIQUE(email)
    );

COMMIT;

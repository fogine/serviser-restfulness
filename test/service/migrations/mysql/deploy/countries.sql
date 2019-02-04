-- Deploy restfulness:countries to mysql
BEGIN;

    CREATE TABLE countries (
        id INT NOT NULL AUTO_INCREMENT,
        name varchar(32),
        code_2 varchar(2),
        PRIMARY KEY (id),
        CONSTRAINT countries_name_key UNIQUE(name)
    );
COMMIT;

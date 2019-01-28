-- Revert restfulness:movies from mysql

BEGIN;

    drop table movies;

COMMIT;

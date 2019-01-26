-- Revert restfulness:movies from pg

BEGIN;

    drop table movies;

COMMIT;

-- Revert restfulness:reviews from pg

BEGIN;

    drop table reviews;

COMMIT;

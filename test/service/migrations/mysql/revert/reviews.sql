-- Revert restfulness:reviews from mysql

BEGIN;

    drop table reviews;

COMMIT;

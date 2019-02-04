-- Revert restfulness:countries from mysql

BEGIN;

    drop table countries;

COMMIT;

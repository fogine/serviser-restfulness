-- Revert restfulness:countries from pg

BEGIN;

    drop table countries;

COMMIT;

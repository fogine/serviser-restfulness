-- Revert restfulness:users from pg

BEGIN;

    drop table users;

COMMIT;

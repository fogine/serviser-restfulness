-- Revert restfulness:users from mysql

BEGIN;

    drop table users;

COMMIT;

-- Revert restfulness:movies_users from mysql

BEGIN;

    drop table movies_users;

COMMIT;

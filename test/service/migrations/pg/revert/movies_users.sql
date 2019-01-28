-- Revert restfulness:movies_users from pg

BEGIN;

    drop table movies_users;

COMMIT;

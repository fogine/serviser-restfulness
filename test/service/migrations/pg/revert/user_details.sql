-- Revert restfulness:user_details from pg

BEGIN;

    drop table user_details;

COMMIT;

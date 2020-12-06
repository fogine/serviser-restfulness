-- Revert restfulness:user_details from mysql

BEGIN;

    drop table user_details;

COMMIT;

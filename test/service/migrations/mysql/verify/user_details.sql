-- Verify restfulness:user_details on mysql

BEGIN;

    select id,country,user_id from user_details where false;

ROLLBACK;

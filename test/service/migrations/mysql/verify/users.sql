-- Verify restfulness:users on mysql

BEGIN;

    select id,username,password,subscribed,created_at,updated_at from users where false;

ROLLBACK;

-- Verify restfulness:movies_users on mysql

BEGIN;

    select id,user_id,movie_id from movies_users where false;

ROLLBACK;

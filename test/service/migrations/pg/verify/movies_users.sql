-- Verify restfulness:movies_users on pg

BEGIN;

    select id,user_id,movie_id from movies_users where false;

ROLLBACK;

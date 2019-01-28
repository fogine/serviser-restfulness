-- Verify restfulness:reviews on pg

BEGIN;

    select id,user_id,movie_id,stars,comment from reviews where false;

ROLLBACK;

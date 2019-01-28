-- Verify restfulness:reviews on mysql

BEGIN;

    select id,user_id,movie_id,stars,comment from reviews where false;

ROLLBACK;

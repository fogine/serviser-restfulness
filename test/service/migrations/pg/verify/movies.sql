-- Verify restfulness:movies on pg

BEGIN;

    select id,name,description,rating,released_at,country_id from movies where false;

ROLLBACK;

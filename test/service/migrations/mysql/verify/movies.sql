-- Verify restfulness:movies on mysql

BEGIN;

    select id,name,description,rating,released_at,country_id from movies where false;

ROLLBACK;

-- Verify restfulness:movies on mysql

BEGIN;

    select id,name,description,rating,released_at from movies where false;

ROLLBACK;

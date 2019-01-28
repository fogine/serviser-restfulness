-- Verify restfulness:movies on pg

BEGIN;

    select id,name,description,rating,released_at from movies where false;

ROLLBACK;

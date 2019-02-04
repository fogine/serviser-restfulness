-- Verify restfulness:countries on pg

BEGIN;

    select id,name,code_2, from countries where false;

ROLLBACK;

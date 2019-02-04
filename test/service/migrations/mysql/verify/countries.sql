-- Revert restfulness:countries from mysql

BEGIN;

    select id,name,code_2 from countries where false;

COMMIT;

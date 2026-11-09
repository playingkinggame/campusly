-- Run after phase6_themes.sql. Each query should return what the comment says.

-- 1. The column exists with the right default (expect: text, 'midnight-aurora'::text, NO)
select column_name, data_type, column_default, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles' and column_name = 'theme';

-- 2. Nobody has an empty theme (expect: 0)
select count(*) as profiles_without_theme from public.profiles where theme is null or theme = '';

-- 3. How many people use each theme
select theme, count(*) from public.profiles group by theme order by count(*) desc;

-- 4. Signed-in users may update ONLY the allowed columns, theme included (expect: a row with 'UPDATE')
select grantee, column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'profiles' and column_name = 'theme' and grantee = 'authenticated';

-- 5. The update policy is still limited to your own row (expect: id = auth.uid() in both columns)
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'profiles' and cmd = 'UPDATE';

-- 6. Other students cannot see anyone's theme (expect: 0 rows)
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'profiles_public' and column_name = 'theme';

-- 관심 등록 폼 저장 테이블 + RLS (anon insert 전용)
-- 적용: Supabase Management API 또는 대시보드 SQL Editor
create table if not exists public.landing_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  role text,
  region text,
  email text,
  consent boolean not null default false
);

alter table public.landing_leads enable row level security;

-- anon 역할은 INSERT만(동의 true 강제). SELECT/UPDATE/DELETE 정책 없음 = 불가.
drop policy if exists "anon insert only" on public.landing_leads;
create policy "anon insert only"
  on public.landing_leads for insert
  to anon
  with check (consent = true);

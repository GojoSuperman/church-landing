-- 관심 등록 폼 저장 테이블 + RLS (anon insert 전용)
-- 적용: Supabase Management API 또는 대시보드 SQL Editor
create table if not exists public.landing_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  church text,        -- 교회명 (필수: 클라이언트 + RLS check)
  name text not null,
  phone text not null,
  role text,
  region text,
  email text,
  consent boolean not null default false
);

alter table public.landing_leads enable row level security;

-- anon 역할은 INSERT만. 동의 + 교회명·성명·전화 비어있지 않을 때만 허용.
drop policy if exists "anon insert only" on public.landing_leads;
create policy "anon insert only"
  on public.landing_leads for insert
  to anon
  with check (
    consent = true
    and char_length(coalesce(church, '')) > 0
    and char_length(coalesce(name, '')) > 0
    and char_length(coalesce(phone, '')) > 0
  );

-- 마이그레이션: church(교회명) 컬럼 추가 + RLS 교회명 필수 강화
alter table public.landing_leads add column if not exists church text;

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

notify pgrst, 'reload schema';

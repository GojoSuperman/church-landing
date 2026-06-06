# 교회 재정 관리 — 홍보 랜딩 페이지

교회 재정 관리 안드로이드 앱을 소개하고 Google Play 설치로 연결하는 모바일 우선 정적 랜딩 페이지입니다.

## 로컬 실행

```bash
python3 -m http.server 8810 --bind 127.0.0.1 --directory .
```

브라우저에서 `http://127.0.0.1:8810` 접속.

## 파일 구조

- `index.html` — 페이지 마크업 (콘텐츠 한국어)
- `assets/css/styles.css` — 디자인 토큰, 레이아웃, 반응형
- `assets/js/config.js` — 공개 상수 (Supabase URL/키, Play 스토어 URL)
- `assets/js/` — 기능별 바닐라 JS 모듈

## Supabase 설정 (관심등록 폼)

- 프로젝트: `church-landing` (ref `qxbizstovrzvoblzgzkh`, 서울 리전). 대시보드: https://supabase.com/dashboard/project/qxbizstovrzvoblzgzkh
- `assets/js/config.js`에 `SUPABASE_URL` + `SUPABASE_ANON_KEY`(anon, 공개 가능) 입력됨. **service_role 키·DB 비밀번호는 절대 커밋 금지** (DB 비번은 `.env.local`, git 제외).
- 스키마/정책: `db/landing_leads.sql` — `landing_leads` 테이블 + RLS(anon **INSERT 전용**, `consent=true` 강제). SELECT/UPDATE/DELETE 불가.
- **제출 내역 열람**: Supabase 대시보드 → Table Editor → `landing_leads`. (anon 키로는 조회 불가, 운영자 대시보드에서만)
- 스키마 재적용 필요 시: 대시보드 SQL Editor에 `db/landing_leads.sql` 붙여넣기.

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

## Supabase 설정

`assets/js/config.js`의 `SUPABASE_URL`과 `SUPABASE_ANON_KEY`는 Task 7에서 채웁니다. anon(publishable) 키만 사용하며, service_role 키는 절대 포함하지 않습니다.

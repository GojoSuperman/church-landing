# Cloudflare Pages 배포 가이드

이 사이트(정적 HTML/CSS/JS + Supabase 백엔드)를 **Cloudflare Pages**로 배포하는 방법.
`git push` → 자동 빌드·배포되며, 대역폭 무제한 무료 플랜이라 "크레딧 소진 정지" 함정이 없다.

## 왜 빌드 스크립트를 쓰나
저장소 루트에는 웹에 공개하면 안 되는 것들(`db/`, `docs/`, `README.md`, `assets/og-card.src.html`)이 섞여 있다.
그래서 루트를 통째로 배포하지 않고, **`scripts/build-site.sh`** 가 공개 대상만 **`dist/`** 로 모은 뒤 그 폴더만 배포한다.

- 포함: `index.html`, `assets/`(단 `*.src.html` 제외), `flyer/`, `share/`
- 제외: `db/`, `docs/`, `README.md`, `.gitignore`, `*.src.html`

로컬 확인:
```bash
bash scripts/build-site.sh   # dist/ 생성
```

## Cloudflare 대시보드 연결 (최초 1회)
1. <https://dash.cloudflare.com> → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. GitHub 인증 → 저장소 **`GojoSuperman/church-landing`** 선택, 프로덕션 브랜치 **`main`**
3. **Build settings** 입력:

   | 항목 | 값 |
   |---|---|
   | Framework preset | **None** |
   | Build command | **`bash scripts/build-site.sh`** |
   | Build output directory | **`dist`** |
   | Root directory | (비움) |

4. **Save and Deploy** → 빌드 후 `https://<프로젝트>.pages.dev` URL 발급

## 환경 변수
**없음.** `assets/js/config.js`의 Supabase 키는 **anon(공개 가능) 키**라 클라이언트에 그대로 노출되어도 안전하다.
(주의: `service_role` 등 비밀 키는 절대 프런트엔드/저장소에 넣지 않는다.)

## 커스텀 도메인 (선택)
프로젝트 → **Custom domains** → 도메인 추가 → 안내되는 CNAME 등록 → 무료 SSL 자동 프로비저닝.

## 이후 운영
- **`git push` (main)** → Cloudflare가 자동으로 `build-site.sh` 실행 후 `dist/` 배포
- PR을 올리면 **미리보기 배포 URL**이 자동 생성된다
- 기존 **Netlify는 병행 유지 가능**(수동 `netlify deploy`). 한쪽으로 정리하려면 Netlify 프로젝트를 삭제/일시정지

## 참고: 캐시 헤더(선택, 나중에)
이미지 장기 캐시가 필요하면 `dist/_headers` 파일을 빌드 시 생성해 `Cache-Control`을 지정할 수 있다. 저트래픽 단계에선 불필요.

# 교회 재정 관리 홍보 랜딩 페이지 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 교회 재정 관리 안드로이드 앱을 소개하고 Google Play 설치로 연결하는 모바일 우선 정적 랜딩 페이지(+관심등록 폼)를 만든다.

**Architecture:** 빌드리스 정적 단일 페이지(`index.html`) + 모듈화된 바닐라 JS(플랫폼 감지·글자크기 토글·폼 전송) + 커스텀 CSS(루트 `font-size` 기반 시니어 토글). 폼은 Supabase JS 클라이언트로 insert 전용 RLS 테이블에 직접 저장(서버 없음). 로컬은 `python3 -m http.server`로 확인, 배포는 정적 호스팅.

**Tech Stack:** HTML5, 커스텀 CSS(CSS 변수), 바닐라 ES modules, Supabase JS v2(CDN), Google Play.

설계 근거: `docs/superpowers/specs/2026-06-06-church-landing-design.md`

---

## 파일 구조

| 파일 | 책임 |
|---|---|
| `index.html` | 페이지 마크업(섹션 구조, 폼). 콘텐츠 한국어 |
| `assets/css/styles.css` | 디자인 토큰(CSS 변수), 레이아웃, 반응형, 시니어 글자크기 스케일 |
| `assets/js/platform.js` | UA 기반 플랫폼 감지(`isIOS`, `isAndroid`), iOS 안내 노출, 설치 버튼 동작 |
| `assets/js/fontscale.js` | 글자크기 토글(보통/큰글자) + localStorage 유지 |
| `assets/js/config.js` | Supabase URL + anon(publishable) 키, Play 스토어 URL 등 공개 상수 |
| `assets/js/form.js` | 관심등록 폼 검증·허니팟·Supabase insert·결과 메시지 |
| `assets/img/` | 앱 아이콘·스크린샷(원본 앱 레포에서 복사) |
| `assets/js/lib/supabase.js` | Supabase JS v2 (CDN에서 받아 vendoring 또는 CDN import) |
| `README.md` | 실행/배포 방법, Supabase 셋업 메모 |

상수(`config.js`)의 anon 키는 공개 가능(브라우저 노출 설계). **service_role 키는 어디에도 포함하지 않는다.**

Play 스토어 설치 URL: `https://play.google.com/store/apps/details?id=com.church.accounting`

---

## Task 1: 프로젝트 골격 + 로컬 서빙

**Files:**
- Create: `index.html`, `assets/css/styles.css`, `assets/js/config.js`, `README.md`

- [ ] **Step 1: 최소 `index.html` 골격 작성**

```html
<!DOCTYPE html>
<html lang="ko" data-fontscale="normal">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>교회 재정 관리 — 쉽고 투명한 교회 회계 앱</title>
  <meta name="description" content="목사님과 회계 직분자를 위한 교회 재정 관리 앱. 수입·지출, 결산 보고서, 헌금영수증, 성도 관리, 백업까지. Google Play 무료 설치.">
  <link rel="stylesheet" href="/assets/css/styles.css">
</head>
<body>
  <main id="app">
    <p>로딩…</p>
  </main>
  <script type="module" src="/assets/js/config.js"></script>
</body>
</html>
```

- [ ] **Step 2: 최소 CSS 토큰 파일 작성**

```css
/* assets/css/styles.css */
:root{
  --c-bg:#f6f8fb; --c-surface:#ffffff; --c-fg:#1f2933; --c-muted:#52606d;
  --c-line:#e4e7eb; --c-primary:#2f6f4f; --c-primary-d:#245c40; --c-accent:#2563eb;
  --radius:14px; --maxw:560px;
  --fs-base:17px;            /* 보통 */
}
html[data-fontscale="large"]{ --fs-base:21px; }  /* 시니어: 전체 rem 스케일 확대 */
html{ font-size:var(--fs-base); -webkit-text-size-adjust:100%; }
*{ box-sizing:border-box; }
body{ margin:0; background:var(--c-bg); color:var(--c-fg);
  font-family:"Pretendard","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;
  line-height:1.7; font-size:1rem; }
img{ max-width:100%; height:auto; display:block; }
a{ color:inherit; }
```

- [ ] **Step 3: `config.js` 작성(키는 Task 8에서 채움)**

```js
// assets/js/config.js
export const PLAY_URL = "https://play.google.com/store/apps/details?id=com.church.accounting";
// Task 8에서 실제 값으로 교체
export const SUPABASE_URL = "";        // 예: https://xxxx.supabase.co
export const SUPABASE_ANON_KEY = "";   // publishable(anon) 키 — 공개 가능
export const CONTACT_KAKAO = "";       // 푸터 문의처(선택). 없으면 빈 문자열
```

- [ ] **Step 4: 로컬 서버로 표시 확인**

Run: `python3 -m http.server 8810 --bind 127.0.0.1 --directory .` (Bash run_in_background:true)
그 후: `curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8810/index.html`
Expected: `200`. 브라우저에서 "로딩…" 보이면 OK.

- [ ] **Step 5: 커밋**

```bash
git add index.html assets/ README.md
git commit -m "feat(landing): 프로젝트 골격 + 디자인 토큰 + 로컬 서빙"
```

---

## Task 2: 글자크기 토글 (보통/큰글자) + 유지

**Files:**
- Create: `assets/js/fontscale.js`
- Modify: `index.html`(상단바 토글 마크업, 모듈 로드), `assets/css/styles.css`(상단바 스타일)

- [ ] **Step 1: 순수 함수로 토글 로직 작성**

```js
// assets/js/fontscale.js
const KEY = "fontscale";
export function getScale(){ return localStorage.getItem(KEY) === "large" ? "large" : "normal"; }
export function applyScale(scale){
  const s = scale === "large" ? "large" : "normal";
  document.documentElement.setAttribute("data-fontscale", s);
  localStorage.setItem(KEY, s);
  document.querySelectorAll("[data-scale-btn]").forEach(b=>{
    b.setAttribute("aria-pressed", String(b.dataset.scaleBtn === s));
  });
}
export function initFontScale(){
  applyScale(getScale());
  document.querySelectorAll("[data-scale-btn]").forEach(b=>{
    b.addEventListener("click", ()=>applyScale(b.dataset.scaleBtn));
  });
}
```

- [ ] **Step 2: 상단바 + 토글 마크업을 `index.html` `<main>` 맨 위에 추가**

```html
<header class="topbar">
  <div class="brand">
    <img src="/assets/img/app-icon.png" alt="교회 재정 관리 앱 아이콘" width="32" height="32">
    <span>교회 재정 관리</span>
  </div>
  <div class="fontscale" role="group" aria-label="글자 크기">
    <button data-scale-btn="normal" aria-pressed="true">보통</button>
    <button data-scale-btn="large" aria-pressed="false">큰 글자</button>
  </div>
</header>
```

- [ ] **Step 3: 상단바 CSS 추가(`styles.css`)**

```css
.topbar{ position:sticky; top:0; z-index:20; display:flex; align-items:center; gap:10px;
  background:var(--c-surface); border-bottom:1px solid var(--c-line); padding:.6rem .9rem; }
.brand{ display:flex; align-items:center; gap:.5rem; font-weight:700; }
.fontscale{ margin-left:auto; display:flex; gap:.3rem; }
.fontscale button{ border:1px solid var(--c-line); background:#fff; border-radius:999px;
  padding:.4rem .8rem; font-size:.95rem; min-height:44px; cursor:pointer; }
.fontscale button[aria-pressed="true"]{ background:var(--c-primary); color:#fff; border-color:var(--c-primary); }
```

- [ ] **Step 4: 모듈 로드(`index.html` 하단 스크립트 교체)**

```html
<script type="module">
  import { initFontScale } from "/assets/js/fontscale.js";
  initFontScale();
</script>
```

- [ ] **Step 5: 확인** — 브라우저에서 "큰 글자" 클릭 시 전체 글자/여백 커지고, 새로고침해도 유지(localStorage). 두 버튼 `aria-pressed` 토글 확인.

- [ ] **Step 6: 커밋**

```bash
git add assets/js/fontscale.js index.html assets/css/styles.css
git commit -m "feat(landing): 글자크기 토글(보통/큰글자) + localStorage 유지"
```

---

## Task 3: 플랫폼 감지 + 하단 고정 설치 바

**Files:**
- Create: `assets/js/platform.js`
- Modify: `index.html`(iOS 배너 자리, 하단 설치 바), `assets/css/styles.css`

- [ ] **Step 1: 플랫폼 감지 + 설치 동작 작성**

```js
// assets/js/platform.js
import { PLAY_URL } from "/assets/js/config.js";
export function isIOS(ua = navigator.userAgent){
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
}
export function isAndroid(ua = navigator.userAgent){ return /Android/.test(ua); }
const IOS_MSG = "이 앱은 안드로이드 전용입니다. 설치는 안드로이드 폰에서 진행해 주세요. 🤖";
export function initPlatform(){
  const ios = isIOS();
  document.querySelectorAll("[data-ios-only]").forEach(el=>{ el.hidden = !ios; });
  document.querySelectorAll("[data-install]").forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      if(ios){ e.preventDefault(); showIosNotice(); }
      // 안드로이드/기타: 기본 a[href=PLAY_URL] 동작으로 이동
    });
    if(btn.tagName === "A"){ btn.href = PLAY_URL; }
  });
}
function showIosNotice(){
  let n = document.getElementById("ios-toast");
  if(!n){ n = document.createElement("div"); n.id="ios-toast"; n.className="toast"; document.body.appendChild(n); }
  n.textContent = IOS_MSG; n.classList.add("show");
  setTimeout(()=>n.classList.remove("show"), 4000);
}
```

- [ ] **Step 2: iOS 배너 + 하단 설치 바 마크업(`index.html`, 상단바 바로 아래 / body 끝)**

```html
<!-- 상단바 아래 -->
<div class="ios-banner" data-ios-only hidden>
  📱 아이폰에서는 <b>소개만</b> 보실 수 있어요. 설치는 <b>안드로이드 폰</b>에서 진행해 주세요.
</div>

<!-- 하단 고정 설치 바 (body 끝, main 밖) -->
<div class="install-bar">
  <a class="btn-install" data-install href="#">📲 구글 플레이에서 설치하기</a>
</div>
```

- [ ] **Step 3: CSS(배너·하단바·버튼·토스트) 추가**

```css
.ios-banner{ background:#fff7ed; color:#9a3412; border-bottom:1px solid #fed7aa;
  padding:.7rem .9rem; font-size:.95rem; text-align:center; }
.install-bar{ position:fixed; left:0; right:0; bottom:0; z-index:30;
  background:var(--c-surface); border-top:1px solid var(--c-line);
  padding:.7rem .9rem calc(.7rem + env(safe-area-inset-bottom)); display:flex; }
.btn-install{ flex:1; text-align:center; background:var(--c-primary); color:#fff; text-decoration:none;
  font-weight:700; font-size:1.05rem; padding:.95rem 1rem; border-radius:12px; min-height:52px;
  display:flex; align-items:center; justify-content:center; }
.btn-install:active{ background:var(--c-primary-d); }
body{ padding-bottom:84px; }  /* 하단바 가림 방지 */
.toast{ position:fixed; left:50%; bottom:92px; transform:translateX(-50%) translateY(12px);
  background:#1f2933; color:#fff; padding:.8rem 1rem; border-radius:10px; max-width:90vw;
  opacity:0; pointer-events:none; transition:.25s; z-index:40; font-size:.95rem; text-align:center; }
.toast.show{ opacity:1; transform:translateX(-50%) translateY(0); }
```

- [ ] **Step 4: 모듈 로드에 `initPlatform` 추가(`index.html` 하단 스크립트)**

```html
<script type="module">
  import { initFontScale } from "/assets/js/fontscale.js";
  import { initPlatform } from "/assets/js/platform.js";
  initFontScale(); initPlatform();
</script>
```

- [ ] **Step 5: 확인** — 데스크톱/안드로이드: 설치 버튼이 Play URL로 이동. iOS(개발자도구 UA를 iPhone으로 변경)에서: 배너 표시 + 설치 버튼 클릭 시 토스트 안내(이동 안 함).

- [ ] **Step 6: 커밋**

```bash
git add assets/js/platform.js index.html assets/css/styles.css
git commit -m "feat(landing): 플랫폼 감지 + 하단 고정 설치 바 + iOS 안내"
```

---

## Task 4: 자산 복사 + 히어로/소개 섹션

**Files:**
- Create: `assets/img/*`(복사)
- Modify: `index.html`, `assets/css/styles.css`

- [ ] **Step 1: 앱 레포에서 이미지 복사(원본 앱 레포는 수정하지 않음 — 읽기만)**

```bash
SRC="$HOME/projects/church-accounting/apps/android/public"
mkdir -p assets/img
cp "$SRC/icon-512x512.png" assets/img/app-icon.png
cp "$SRC/help/Main.png" assets/img/screen-main.png
cp "$SRC/help/Expense_records_01.png" assets/img/feat-expense.png
cp "$SRC/help/closing_monthly_statement_report_03.png" assets/img/feat-report.png
cp "$SRC/help/Donation_receipt_individual_03.png" assets/img/feat-receipt.png
cp "$SRC/help/membership_01.png" assets/img/feat-members.png
cp "$SRC/help/setting_Data_Backup_01.png" assets/img/feat-backup.png
```
(파일명이 다르면 `ls "$SRC/help"`로 확인 후 가장 적합한 캡처로 대체)

- [ ] **Step 2: 히어로 + 소개 섹션 마크업(`index.html`, 상단바/배너 다음 `<main>` 안)**

```html
<section class="hero">
  <h1>교회 재정,<br>쉽고 투명하게</h1>
  <p class="lead">목사님과 회계 직분자를 위한 교회 전용 재정 관리 앱.<br>복잡한 장부 없이 수입·지출부터 결산 보고서까지.</p>
  <a class="btn-install hero-cta" data-install href="#">📲 구글 플레이에서 무료 설치</a>
  <img class="hero-shot" src="/assets/img/screen-main.png" alt="앱 메인 화면" loading="lazy">
</section>

<section class="who section">
  <h2>누구를 위한 앱인가요?</h2>
  <p>교회 살림을 맡으신 <b>목사님</b >, <b>회계·재정 직분자</b>를 위해 만들었습니다. 회계 전문 지식이 없어도 누구나 쉽게 쓸 수 있습니다.</p>
  <p class="free-note">✅ Google Play에서 <b>무료로 설치</b>해 바로 시작하세요.</p>
</section>
```

- [ ] **Step 3: 레이아웃/섹션 CSS**

```css
main{ max-width:var(--maxw); margin:0 auto; }
.section{ padding:1.8rem 1.1rem; }
.hero{ padding:1.6rem 1.1rem .4rem; text-align:center; }
.hero h1{ font-size:1.9rem; line-height:1.25; margin:.2rem 0 .6rem; }
.hero .lead{ color:var(--c-muted); margin:0 0 1.1rem; }
.hero-cta{ margin:0 auto 1.3rem; max-width:340px; }
.hero-shot{ margin:0 auto; max-width:280px; border-radius:18px; box-shadow:0 10px 30px rgba(0,0,0,.12); }
h2{ font-size:1.35rem; margin:0 0 .7rem; }
.free-note{ background:#ecfdf5; border:1px solid #a7f3d0; color:#065f46; padding:.7rem .9rem; border-radius:10px; }
```

- [ ] **Step 4: 확인** — 히어로 카피·스크린샷·CTA 표시, 모바일 폭(375px)에서 깨짐 없음. 큰 글자 모드에서도 레이아웃 유지.

- [ ] **Step 5: 커밋**

```bash
git add assets/img index.html assets/css/styles.css
git commit -m "feat(landing): 자산 복사 + 히어로/소개 섹션"
```

---

## Task 5: 핵심 강점 4 + 주요 기능(스크린샷) 섹션

**Files:** Modify `index.html`, `assets/css/styles.css`

- [ ] **Step 1: 강점 4 + 기능 섹션 마크업 추가(`<main>` 안, 소개 다음)**

```html
<section class="strengths section">
  <h2>이런 점이 좋아요</h2>
  <ul class="grid2">
    <li><span class="ico">👍</span><b>쉽고 직관적</b><p>회계 비전문가·어르신도 쉽게. 입력하면 보고서가 자동으로.</p></li>
    <li><span class="ico">⛪</span><b>한국 교회 특화</b><p>헌금·십일조 분류, 결산서, 성도 관리까지 교회 실무에 딱.</p></li>
    <li><span class="ico">🔒</span><b>데이터 안전·투명</b><p>기기 내 저장 + 백업/복원 + 감사 기능으로 안심.</p></li>
    <li><span class="ico">🆓</span><b>비용 부담 없음</b><p>Google Play에서 무료로 설치해 바로 사용.</p></li>
  </ul>
</section>

<section class="features section">
  <h2>주요 기능</h2>
  <div class="feature"><img src="/assets/img/feat-expense.png" alt="수입·지출 기록 화면" loading="lazy"><div><b>수입·지출 기록</b><p>헌금·지출을 몇 번의 탭으로 간편하게 기록합니다.</p></div></div>
  <div class="feature"><img src="/assets/img/feat-report.png" alt="결산 보고서 화면" loading="lazy"><div><b>결산 보고서 자동 생성</b><p>월·연간 결산서를 자동으로 만들어 출력·공유.</p></div></div>
  <div class="feature"><img src="/assets/img/feat-receipt.png" alt="헌금영수증 화면" loading="lazy"><div><b>헌금영수증</b><p>성도별 헌금영수증을 손쉽게 발급합니다.</p></div></div>
  <div class="feature"><img src="/assets/img/feat-members.png" alt="성도 관리 화면" loading="lazy"><div><b>성도 관리</b><p>성도 명단과 헌금 내역을 한 곳에서 관리.</p></div></div>
  <div class="feature"><img src="/assets/img/feat-backup.png" alt="백업/복원 화면" loading="lazy"><div><b>백업·복원</b><p>데이터를 안전하게 백업하고 새 기기로 복원.</p></div></div>
</section>
```

- [ ] **Step 2: CSS(그리드·기능 교차 배치)**

```css
.grid2{ list-style:none; padding:0; margin:0; display:grid; grid-template-columns:1fr 1fr; gap:.8rem; }
.grid2 li{ background:var(--c-surface); border:1px solid var(--c-line); border-radius:12px; padding:1rem .9rem; }
.grid2 .ico{ font-size:1.6rem; }
.grid2 b{ display:block; margin:.4rem 0 .2rem; }
.grid2 p{ margin:0; color:var(--c-muted); font-size:.95rem; }
.feature{ display:flex; gap:1rem; align-items:center; background:var(--c-surface);
  border:1px solid var(--c-line); border-radius:12px; padding:1rem; margin-bottom:.9rem; }
.feature img{ width:110px; border-radius:10px; flex:0 0 auto; }
.feature b{ display:block; margin-bottom:.25rem; }
.feature p{ margin:0; color:var(--c-muted); font-size:.95rem; }
@media (max-width:360px){ .grid2{ grid-template-columns:1fr; } }
```

- [ ] **Step 3: 확인** — 강점 4칸 그리드, 기능 5개 스크린샷+설명 표시. 큰 글자 모드에서 텍스트 넘침 없음.

- [ ] **Step 4: 커밋**

```bash
git add index.html assets/css/styles.css
git commit -m "feat(landing): 핵심 강점 4 + 주요 기능 섹션"
```

---

## Task 6: 3단계 시작 + 데이터 안전 + FAQ

**Files:** Modify `index.html`, `assets/css/styles.css`

- [ ] **Step 1: 세 섹션 마크업 추가**

```html
<section class="steps section">
  <h2>3단계로 시작</h2>
  <ol class="steps-list">
    <li><b>1. 설치</b><p>Google Play에서 무료로 설치합니다.</p></li>
    <li><b>2. 교회·직분 설정</b><p>교회 정보와 직분(목사/회계 등)을 한 번만 설정.</p></li>
    <li><b>3. 바로 기록</b><p>첫 헌금/지출부터 바로 입력하면 보고서가 자동 생성.</p></li>
  </ol>
</section>

<section class="safety section">
  <h2>데이터는 안전하게</h2>
  <ul class="check">
    <li>✅ 데이터는 <b>내 기기에 저장</b>됩니다.</li>
    <li>✅ <b>백업/복원</b>으로 기기 변경·분실에도 안심.</li>
    <li>✅ <b>감사 기능</b>으로 재정의 투명성을 지킵니다.</li>
  </ul>
</section>

<section class="faq section">
  <h2>자주 묻는 질문</h2>
  <details><summary>정말 무료인가요?</summary><p>네, Google Play에서 무료로 설치해 사용하실 수 있습니다.</p></details>
  <details><summary>아이폰에서도 쓸 수 있나요?</summary><p>현재 앱은 안드로이드 전용입니다. 이 소개 페이지는 아이폰에서도 보실 수 있지만, 설치·사용은 안드로이드 폰에서 가능합니다.</p></details>
  <details><summary>데이터는 어디에 저장되나요?</summary><p>기본적으로 사용하시는 기기 안에 저장되며, 백업/복원 기능으로 안전하게 보관할 수 있습니다.</p></details>
</section>
```

- [ ] **Step 2: CSS 추가**

```css
.steps-list{ list-style:none; padding:0; margin:0; display:grid; gap:.7rem; }
.steps-list li{ background:var(--c-surface); border:1px solid var(--c-line); border-radius:12px; padding:.9rem 1rem; }
.steps-list b{ color:var(--c-primary); }
.check{ list-style:none; padding:0; margin:0; display:grid; gap:.5rem; }
.faq details{ background:var(--c-surface); border:1px solid var(--c-line); border-radius:10px; padding:.4rem .9rem; margin-bottom:.6rem; }
.faq summary{ cursor:pointer; font-weight:600; padding:.5rem 0; min-height:44px; display:flex; align-items:center; }
.faq p{ margin:.2rem 0 .8rem; color:var(--c-muted); }
```

- [ ] **Step 3: 확인** — 세 섹션 표시, FAQ 펼침 동작.

- [ ] **Step 4: 커밋**

```bash
git add index.html assets/css/styles.css
git commit -m "feat(landing): 3단계 시작 + 데이터 안전 + FAQ"
```

---

## Task 7: Supabase 프로젝트 + 테이블 + RLS (외부 셋업)

**Files:** Modify `assets/js/config.js`, `README.md`

- [ ] **Step 1: 새 Supabase 프로젝트 생성**

Run: `supabase projects create church-landing --org-id <ORG_ID> --region ap-northeast-2 --db-password <강력한비번>`
(ORG_ID는 `supabase projects list`의 ORG ID `hzpwozwthwftaqlckggz` 사용. 무료 슬롯 1자리 여유 확인됨.)
생성 후 `supabase projects api-keys --project-ref <REF>`로 URL/anon 키 확인.
Expected: 프로젝트 생성 + REF/anon 키 확보.

- [ ] **Step 2: 테이블 + RLS SQL 적용**

Supabase 대시보드 SQL Editor(또는 `supabase db` 연결)에서 실행:

```sql
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

-- anon 은 INSERT 만(동의 true 강제). SELECT/UPDATE/DELETE 정책 없음 = 불가.
create policy "anon insert only"
  on public.landing_leads for insert
  to anon
  with check (consent = true);
```

- [ ] **Step 3: 검증 — anon 으로 SELECT 안 되는지 확인**

Run(임시): `curl -s "<SUPABASE_URL>/rest/v1/landing_leads?select=*" -H "apikey: <ANON_KEY>"`
Expected: 빈 배열 `[]` 또는 권한 에러(데이터 노출 안 됨). INSERT는 폼에서 Task 8로 검증.

- [ ] **Step 4: `config.js`에 실제 값 채우기**

```js
export const SUPABASE_URL = "https://<REF>.supabase.co";
export const SUPABASE_ANON_KEY = "<anon publishable key>";
```
(anon 키는 공개 가능. **service_role 키는 절대 넣지 않는다.**)

- [ ] **Step 5: README에 Supabase 셋업·열람 방법 기록 + 커밋**

```bash
git add assets/js/config.js README.md
git commit -m "chore(landing): Supabase 프로젝트 연결(anon) + landing_leads 테이블/RLS"
```

---

## Task 8: 관심 등록 폼 (UI + 검증 + Supabase insert)

**Files:** Create `assets/js/form.js`; Modify `index.html`, `assets/css/styles.css`

- [ ] **Step 1: 폼 마크업 추가(`<main>` 안, FAQ 다음 / 데이터안전 뒤 적절 위치)**

```html
<section class="lead-form section">
  <h2>관심 등록 / 문의 남기기</h2>
  <p class="muted">설치·사용 안내를 받아보시려면 남겨 주세요. (선택)</p>
  <form id="leadForm" novalidate>
    <label>성명 <span class="req">*</span>
      <input name="name" required autocomplete="name" maxlength="40">
    </label>
    <label>전화번호 <span class="req">*</span>
      <input name="phone" required inputmode="tel" autocomplete="tel" maxlength="20" placeholder="010-0000-0000">
    </label>
    <label>직분
      <select name="role">
        <option value="">선택 안 함</option>
        <option>목사</option><option>장로</option><option>권사</option>
        <option>집사</option><option>회계</option><option>기타</option>
      </select>
    </label>
    <label>지역 <input name="region" maxlength="60" placeholder="예: 서울 / OO교회"></label>
    <label>이메일 <input name="email" type="email" autocomplete="email" maxlength="80"></label>
    <label class="consent">
      <input type="checkbox" name="consent" required>
      <span>개인정보 수집·이용에 동의합니다. (수집: 성명·전화·직분·지역·이메일 / 목적: 앱 안내·문의 응대 / 보관: 목적 달성 후 파기)</span>
    </label>
    <!-- 허니팟(봇 차단): 사람에겐 숨김 -->
    <input type="text" name="website" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
    <button type="submit" class="btn-submit">등록하기</button>
    <p id="formMsg" class="form-msg" role="status" aria-live="polite"></p>
  </form>
</section>
```

- [ ] **Step 2: 폼 로직 작성(검증·허니팟·insert)**

```js
// assets/js/form.js
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "/assets/js/config.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function initLeadForm(){
  const form = document.getElementById("leadForm");
  if(!form) return;
  const msg = document.getElementById("formMsg");
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    msg.textContent = ""; msg.className = "form-msg";
    const f = new FormData(form);
    if(f.get("website")){ return; } // 허니팟 채워짐 = 봇 → 조용히 무시
    const name = (f.get("name")||"").toString().trim();
    const phone = (f.get("phone")||"").toString().trim();
    if(!name || !phone){ return fail("성명과 전화번호를 입력해 주세요."); }
    if(!form.consent.checked){ return fail("개인정보 수집·이용에 동의해 주세요."); }

    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "등록 중…";
    const { error } = await sb.from("landing_leads").insert({
      name, phone,
      role: (f.get("role")||"").toString() || null,
      region: (f.get("region")||"").toString().trim() || null,
      email: (f.get("email")||"").toString().trim() || null,
      consent: true,
    });
    btn.disabled = false; btn.textContent = "등록하기";
    if(error){ return fail("전송에 실패했습니다. 잠시 후 다시 시도해 주세요."); }
    form.reset();
    msg.textContent = "등록되었습니다. 감사합니다 🙏";
    msg.classList.add("ok");
  });

  function fail(t){ msg.textContent = t; msg.classList.add("err"); }
}
```

- [ ] **Step 3: 폼 CSS + 허니팟 숨김**

```css
.lead-form form{ display:grid; gap:.8rem; }
.lead-form label{ display:grid; gap:.35rem; font-weight:600; }
.lead-form input, .lead-form select{ font:inherit; padding:.8rem .9rem; border:1px solid var(--c-line);
  border-radius:10px; min-height:48px; background:#fff; }
.lead-form .req{ color:#dc2626; }
.consent{ grid-template-columns:auto 1fr; align-items:start; font-weight:400; font-size:.92rem; color:var(--c-muted); }
.consent input{ min-height:auto; width:22px; height:22px; margin-top:.2rem; }
.hp{ position:absolute; left:-9999px; width:1px; height:1px; opacity:0; }
.btn-submit{ background:var(--c-accent); color:#fff; border:0; border-radius:12px; padding:.95rem;
  font-size:1.05rem; font-weight:700; min-height:52px; cursor:pointer; }
.form-msg{ margin:.3rem 0 0; min-height:1.4em; }
.form-msg.ok{ color:#065f46; } .form-msg.err{ color:#b91c1c; }
```

- [ ] **Step 4: 모듈 로드에 `initLeadForm` 추가(`index.html` 하단 스크립트)**

```html
<script type="module">
  import { initFontScale } from "/assets/js/fontscale.js";
  import { initPlatform } from "/assets/js/platform.js";
  import { initLeadForm } from "/assets/js/form.js";
  initFontScale(); initPlatform(); initLeadForm();
</script>
```

- [ ] **Step 5: 확인(실제 전송 1건)** — 필수 누락/동의 미체크 시 에러 메시지. 정상 입력 시 "등록되었습니다" + Supabase 대시보드 `landing_leads`에 행 1건 확인.

- [ ] **Step 6: 커밋**

```bash
git add assets/js/form.js index.html assets/css/styles.css
git commit -m "feat(landing): 관심등록 폼 + 검증/허니팟 + Supabase insert"
```

---

## Task 9: 마지막 CTA + 푸터 + 메타/OG/파비콘

**Files:** Modify `index.html`, Create `assets/img/og.png`(선택)

- [ ] **Step 1: 마지막 설치 유도 + 푸터 마크업(`<main>` 끝)**

```html
<section class="final section">
  <h2>지금 시작해 보세요</h2>
  <a class="btn-install" data-install href="#">📲 구글 플레이에서 무료 설치</a>
</section>
<footer class="foot">
  <p>교회 재정 관리 · 안드로이드 앱</p>
  <p class="muted">패키지: com.church.accounting</p>
  <!-- CONTACT_KAKAO 가 있으면 문의 안내 표시(Task 11에서 동적 처리 가능) -->
</footer>
```

- [ ] **Step 2: `<head>`에 OG/트위터/파비콘 메타 추가**

```html
<meta property="og:type" content="website">
<meta property="og:title" content="교회 재정 관리 — 쉽고 투명한 교회 회계 앱">
<meta property="og:description" content="목사님과 회계 직분자를 위한 무료 교회 재정 관리 앱. Google Play에서 설치하세요.">
<meta property="og:image" content="/assets/img/app-icon.png">
<meta name="twitter:card" content="summary">
<link rel="icon" href="/assets/img/app-icon.png">
```

- [ ] **Step 3: 푸터 CSS**

```css
.final{ text-align:center; }
.final .btn-install{ max-width:340px; margin:.6rem auto 0; }
.foot{ text-align:center; padding:1.6rem 1rem 2rem; color:var(--c-muted); font-size:.9rem; }
.muted{ color:var(--c-muted); }
```

- [ ] **Step 4: 확인** — 페이지 끝 CTA·푸터 표시. 브라우저 탭 파비콘/제목 정상.

- [ ] **Step 5: 커밋**

```bash
git add index.html assets/css/styles.css assets/img
git commit -m "feat(landing): 마지막 CTA + 푸터 + 메타/OG/파비콘"
```

---

## Task 10: 크로스 디바이스 QA + 배포

**Files:** Create `README.md`(배포 절차 보강)

- [ ] **Step 1: QA 체크(로컬 서버 + 브라우저 기기 에뮬레이션)**

확인 항목(각각 통과 체크):
- 모바일 375px / 414px 폭에서 레이아웃 깨짐 없음
- 큰 글자 토글 → 전체 확대 + 유지(새로고침)
- 안드로이드 UA: 설치 버튼 → Play URL 이동
- iOS UA: 배너 표시 + 설치 버튼 → 토스트 안내(이동 안 함)
- 하단 설치 바가 콘텐츠를 가리지 않음(`body` 하단 패딩)
- 폼: 필수/동의 검증, 정상 전송 1건 DB 기록, 허니팟 채우면 무시

- [ ] **Step 2: 배포(택1)**

옵션 A(권장, Netlify — 지금 비어있음):
Run: `npx netlify-cli deploy --dir . --prod` (사이트 생성/연결)
옵션 B(Vercel):
Run: `npx vercel --prod`
Expected: 공개 URL 확보(예: `https://church-...netlify.app`).

- [ ] **Step 3: 배포 URL에서 재확인** — HTTPS 접속, 폼 전송 1건 정상, iOS/안드로이드 동작.

- [ ] **Step 4: README에 배포 URL·갱신 방법 기록 + 커밋**

```bash
git add README.md
git commit -m "docs(landing): 배포 절차 + 배포 URL 기록"
```

- [ ] **Step 5: GitHub 공개 레포 생성 + 푸시**

```bash
gh repo create church-landing --public --source . --remote origin --push
```

---

## 후속(이 계획 범위 밖, 배포 후 별도 진행)

- **A4 인쇄 전단지**: 배포 URL로 QR 코드 생성(예: `qrencode` 또는 온라인) + 짧은 홍보 문구로 A4 한 장 디자인(교회 게시판·주보 삽지용). 별도 spec/plan으로 진행.

---

## 자기 검토(Self-Review) 메모

- **스펙 커버리지**: 목적/대상(Task4,5) · 유입흐름·하단 고정 설치바(Task3) · 글자크기 토글(Task2) · iOS 안내(Task3) · 강점4(Task5) · 기능 스크린샷(Task4,5) · 3단계/데이터안전/FAQ(Task6) · 관심등록 폼+Supabase+RLS(Task7,8) · 비주얼/자산(Task1,4) · 배포(Task10) · A4(후속). 누락 없음.
- **플레이스홀더**: 키/REF 등은 Task7에서 실제 값으로 채우는 단계 명시(설계상 외부 셋업). 그 외 추상 지시 없음.
- **타입/명명 일관성**: `data-install`, `data-scale-btn`, `data-ios-only`, `landing_leads`, 함수 `initFontScale/initPlatform/initLeadForm` — 태스크 간 일치 확인.

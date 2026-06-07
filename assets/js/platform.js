// assets/js/platform.js
import { PLAY_URL } from "/assets/js/config.js";
export function isIOS(ua = navigator.userAgent){
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
}
export function isAndroid(ua = navigator.userAgent){ return /Android/.test(ua); }

const IOS_MSG = "이 앱은 안드로이드 전용입니다. 설치는 안드로이드 폰에서 진행해 주세요. 🤖";
const REGISTER_MSG = "먼저 관심 등록을 해주세요.";
const LS_KEY = "lead_registered";

// 관심등록 완료 여부(localStorage 에 저장 → 재방문에도 유지)
let registered = false;

export function initPlatform(){
  const ios = isIOS();
  registered = localStorage.getItem(LS_KEY) === "1";

  document.querySelectorAll("[data-ios-only]").forEach(el=>{ el.hidden = !ios; });

  document.querySelectorAll("[data-install]").forEach(btn=>{
    if(btn.tagName === "A"){ btn.href = PLAY_URL; }
    btn.addEventListener("click", (e)=>{
      // 1) 관심등록 전에는 설치 링크 비활성 → 폼으로 유도
      if(!registered){
        e.preventDefault();
        promptRegister();
        return;
      }
      // 2) 등록했어도 iOS 는 설치 불가 안내
      if(ios){ e.preventDefault(); showToast(IOS_MSG); return; }
      // 3) 등록 완료 + 안드로이드/기타 → 기본 a[href=PLAY_URL] 동작으로 이동
    });
  });

  applyLockState();

  // 폼 등록 완료 신호를 받으면 잠금 해제
  document.addEventListener("lead:registered", ()=>{
    registered = true;
    applyLockState();
  });
}

// 설치 버튼 잠금/해제 시각 상태 반영
function applyLockState(){
  document.querySelectorAll("[data-install]").forEach(btn=>{
    btn.classList.toggle("locked", !registered);
    btn.setAttribute("aria-disabled", String(!registered));
  });
}

// 미등록 상태에서 설치를 누르면: 안내 + 관심등록 폼으로 스크롤·강조
function promptRegister(){
  showToast(REGISTER_MSG, true);
  const form = document.querySelector(".lead-form");
  if(!form) return;
  form.scrollIntoView({ behavior:"smooth", block:"start" });
  form.classList.remove("flash");
  void form.offsetWidth; // 리플로우 → 애니메이션 재시작
  form.classList.add("flash");
}

function showToast(message, nowrap=false){
  let n = document.getElementById("app-toast");
  if(!n){ n = document.createElement("div"); n.id="app-toast"; n.className="toast"; document.body.appendChild(n); }
  n.textContent = message; n.classList.toggle("nowrap", nowrap); n.classList.add("show");
  clearTimeout(n._t);
  n._t = setTimeout(()=>n.classList.remove("show"), 4000);
}

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

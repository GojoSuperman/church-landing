// assets/js/form.js
import { SUPABASE_URL, SUPABASE_ANON_KEY, PLAY_URL } from "/assets/js/config.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LS_KEY = "lead_registered"; // 관심등록 완료 플래그(platform.js 와 동일 키)

export function initLeadForm(){
  const form = document.getElementById("leadForm");
  if(!form) return;
  const msg = document.getElementById("formMsg");
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 이미 등록한 폰(재방문): 관심등록 폼만 잠금. 스토어 버튼은 platform.js 가 활성 유지.
  if(localStorage.getItem(LS_KEY) === "1"){ lockForm(); }

  // 전화번호 자동 하이픈
  const phoneInput = form.querySelector("input[name=phone]");
  if(phoneInput){
    phoneInput.addEventListener("input", () => {
      const digits = phoneInput.value.replace(/\D/g, "").slice(0, 11);
      if(digits.length <= 3){
        phoneInput.value = digits;
      } else if(digits.length <= 6){
        phoneInput.value = digits.slice(0,3) + "-" + digits.slice(3);
      } else if(digits.length <= 10){
        // 10자리: 3-3-4 (예: 02-123-4567)
        phoneInput.value = digits.slice(0,3) + "-" + digits.slice(3,6) + "-" + digits.slice(6);
      } else {
        // 11자리: 3-4-4 (예: 010-1234-5678)
        phoneInput.value = digits.slice(0,3) + "-" + digits.slice(3,7) + "-" + digits.slice(7);
      }
    });
  }

  // 이메일 도메인 직접입력 토글
  const domainSelect = form.querySelector("select[name=emailDomain]");
  const domainCustom = form.querySelector("input[name=emailDomainCustom]");
  if(domainSelect && domainCustom){
    domainSelect.addEventListener("change", () => {
      const isCustom = domainSelect.value === "__custom__";
      domainCustom.hidden = !isCustom;
      if(isCustom) domainCustom.focus();
    });
  }

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    msg.textContent = ""; msg.className = "form-msg";
    const f = new FormData(form);
    if(f.get("website")){ return; } // 허니팟 채워짐 = 봇 → 조용히 무시

    const church = (f.get("church")||"").toString().trim();
    const name = (f.get("name")||"").toString().trim();
    const phone = (f.get("phone")||"").toString().trim();

    if(!church){ return fail("교회명을 입력해 주세요."); }
    if(!name || !phone){ return fail("성명과 전화번호를 입력해 주세요."); }
    if(!form.consent.checked){ return fail("개인정보 수집·이용에 동의해 주세요."); }

    // 이메일 조합
    const emailId = (f.get("emailId")||"").toString().trim();
    let email = null;
    if(emailId){
      const domainVal = (f.get("emailDomain")||"").toString();
      let domain = domainVal;
      if(domainVal === "__custom__"){
        domain = (f.get("emailDomainCustom")||"").toString().trim();
        if(!domain){ return fail("이메일 서비스(도메인)를 입력해 주세요."); }
      }
      email = emailId + "@" + domain;
    }

    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "등록 중…";
    const { error } = await sb.from("landing_leads").insert({
      church,
      name,
      phone,
      role: (f.get("role")||"").toString() || null,
      region: (f.get("region")||"").toString().trim() || null,
      email,
      consent: true,
    });
    btn.disabled = false; btn.textContent = "등록하기";
    if(error){ return fail("전송에 실패했습니다. 잠시 후 다시 시도해 주세요."); }
    form.reset();
    // reset 후 custom domain 인풋 다시 숨김
    if(domainCustom) domainCustom.hidden = true;
    // 관심등록 완료 → 설치 버튼 잠금 해제 (재방문에도 유지) + 폼 잠금
    localStorage.setItem(LS_KEY, "1");
    document.dispatchEvent(new CustomEvent("lead:registered"));
    lockForm();
    // 감사 모달 표시 후 구글스토어로 자동 이동
    showRedirectModal();
    setTimeout(()=>{ window.location.href = PLAY_URL; }, 1500);
  });

  function fail(t){ msg.textContent = t; msg.classList.add("err"); }

  // 재방문/등록완료: 폼 입력을 비활성화하고 완료 안내를 표시
  function lockForm(){
    form.querySelectorAll("input, select, textarea, button").forEach(el=>{ el.disabled = true; });
    form.classList.add("is-done");
    const section = form.closest(".lead-form") || form.parentElement;
    if(section && !section.querySelector(".lead-done-note")){
      const note = document.createElement("p");
      note.className = "lead-done-note";
      note.textContent = "이미 관심 등록을 완료하셨어요 🙏 설치가 아직이라면 ‘구글 플레이’ 버튼으로 바로 설치하실 수 있어요.";
      section.insertBefore(note, form);
    }
  }
}

// 등록 완료 → "구글스토어로 이동" 안내 모달
function showRedirectModal(){
  const ov = document.createElement("div");
  ov.className = "modal-overlay";
  ov.innerHTML = '<div class="modal" role="alertdialog" aria-live="assertive">'
    + '<p class="modal-title">감사합니다 🙏</p>'
    + '<p class="modal-desc">구글스토어로 바로 이동합니다…</p></div>';
  document.body.appendChild(ov);
  requestAnimationFrame(()=> ov.classList.add("show"));
}

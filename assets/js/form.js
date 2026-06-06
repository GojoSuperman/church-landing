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

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

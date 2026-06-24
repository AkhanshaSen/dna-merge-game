export function renderLoading(mainEl, main, sub) {
  mainEl.innerHTML = `<div class="card card-loading anim-up">
    <div class="spin"></div>
    <div class="loading-title">${main}</div>
    <div class="loading-sub">${sub}</div>
    <div class="dots dots-center"><span></span><span></span><span></span></div>
  </div>`;
}

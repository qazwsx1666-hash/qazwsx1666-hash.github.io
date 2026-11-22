/* ==========================================================================
   요즘 테스트 — common.js
   공통 유틸: 토스트, 복사, 공유, 해시 상태
   ========================================================================== */
(function (global) {
  "use strict";

  var CT = {};

  CT.$ = function (sel, root) { return (root || document).querySelector(sel); };
  CT.$$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* ---------- 토스트 ---------- */
  var toastEl = null;
  var toastTimer = null;
  CT.toast = function (msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-show");
    }, 2000);
  };

  /* ---------- 복사 (구형 브라우저 폴백 포함) ---------- */
  CT.copy = function (text, okMsg) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        CT.toast(okMsg || "복사했어요. 단톡방에 붙여넣기 해보세요!");
      }).catch(function () {
        if (fallback()) CT.toast(okMsg || "복사했어요. 단톡방에 붙여넣기 해보세요!");
        else CT.toast("복사가 차단됐어요. 길게 눌러 직접 복사해 주세요.");
      });
    } else if (fallback()) {
      CT.toast(okMsg || "복사했어요. 단톡방에 붙여넣기 해보세요!");
    } else {
      CT.toast("복사가 차단됐어요. 길게 눌러 직접 복사해 주세요.");
    }
  };

  /* ---------- 결과 링크 ---------- */
  CT.resultUrl = function (code) {
    var base = location.origin + location.pathname;
    return code ? base + "#r=" + encodeURIComponent(code) : base;
  };

  CT.getHashCode = function () {
    var m = /(?:^#|&)r=([^&]+)/.exec(location.hash || "");
    if (!m) return "";
    try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; }
  };

  CT.setHashCode = function (code) {
    if (!code) return;
    var url = location.pathname + location.search + "#r=" + encodeURIComponent(code);
    try { history.replaceState(null, "", url); } catch (e) { /* noop */ }
  };

  /* ---------- 공유 ---------- */
  CT.share = function (payload) {
    var data = {
      title: payload.title || document.title,
      text: payload.text || "",
      url: payload.url || location.href
    };
    if (navigator.share) {
      navigator.share(data).then(function () {
        /* 공유 완료 */
      }).catch(function (err) {
        if (err && err.name === "AbortError") return;
        CT.copy(data.text + "\n" + data.url, "공유가 안 돼서 복사했어요. 붙여넣기 해보세요!");
      });
    } else {
      CT.copy(data.text + "\n" + data.url, "링크와 결과를 복사했어요. 카톡에 붙여넣기 해보세요!");
    }
  };

  /* ---------- 저장 (이어하기) ---------- */
  CT.store = {
    get: function (key) {
      try { return JSON.parse(localStorage.getItem("viral:" + key) || "null"); }
      catch (e) { return null; }
    },
    set: function (key, value) {
      try { localStorage.setItem("viral:" + key, JSON.stringify(value)); }
      catch (e) { /* 저장 불가 환경 무시 */ }
    }
  };

  /* ---------- 문자열 ---------- */
  CT.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  CT.pct = function (n) { return Math.round(n) + "%"; };

  global.CT = CT;
})(window);

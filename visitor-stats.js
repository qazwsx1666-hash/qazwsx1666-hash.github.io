/*!
 * 오늘 방문자 수 표시 (footer 맨 아래)
 * - countapi.mileshilliard.com 무료 카운터 사용 (JSON, CORS 허용, 키 발급 불필요)
 * - 오늘 카운트: 키에 한국시간 날짜를 넣어 자정에 자동으로 0부터 다시 집계
 * - 브라우저당 하루 1회만 증가시켜 "방문자(고유 방문)" 기준으로 셈
 * - 실패하면 3회 재시도하고, 그래도 실패하면 그날 마지막 성공값을 표시(없으면 표시하지 않음)
 */
(function () {
  'use strict';
  if (window.__visitStatsLoaded) return;
  window.__visitStatsLoaded = true;

  var API = 'https://countapi.mileshilliard.com/api/v1/';
  var NS = 'ghq1666';
  var SECTIONS = {
    'invest-tools': 'invest',
    'career-tools': 'career',
    'health-calc': 'health',
    'tax-tools': 'tax',
    'fortune-life': 'fortune',
    'viral-test': 'viral',
    'finance-tools': 'finance'
  };
  var STYLE_ID = 'visit-stats-style';
  var CACHE_TTL = 120000;
  var RETRY_DELAYS = [500, 1100];

  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }
  function ssGet(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) {} }

  function section() {
    var seg = (location.pathname.split('/').filter(Boolean)[0] || '').toLowerCase();
    if (/\.html?$/.test(seg)) seg = '';
    return SECTIONS[seg] || 'root';
  }

  function dayKey() {
    var kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    var m = kst.getUTCMonth() + 1;
    var d = kst.getUTCDate();
    return String(kst.getUTCFullYear()) + (m < 10 ? '0' + m : m) + (d < 10 ? '0' + d : d);
  }

  function fmt(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function request(path) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var ctl = null;
      try { if ('AbortController' in window) ctl = new AbortController(); } catch (e) {}
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        try { if (ctl) ctl.abort(); } catch (e) {}
        reject(new Error('timeout'));
      }, 6000);
      var opts = { method: 'GET', mode: 'cors', cache: 'no-store', credentials: 'omit' };
      if (ctl) opts.signal = ctl.signal;

      fetch(API + path, opts).then(function (res) {
        if (res.status === 404) return { value: 0 };
        if (!res.ok) throw new Error('http ' + res.status);
        return res.json();
      }).then(function (data) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (!data || typeof data.value === 'undefined') { reject(new Error('bad payload')); return; }
        var n = parseInt(data.value, 10);
        if (isNaN(n) || n < 0) { reject(new Error('bad value')); return; }
        resolve(n);
      }).catch(function (err) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  // 일시적인 서버 오류(5xx·연결 끊김)가 있어 몇 번 다시 시도한다
  function attempt(path, i) {
    i = i || 0;
    return request(path).catch(function (err) {
      if (i >= RETRY_DELAYS.length) throw err;
      return new Promise(function (resolve) { setTimeout(resolve, RETRY_DELAYS[i]); })
        .then(function () { return attempt(path, i + 1); });
    });
  }

  function lastNumbers(sec, day) {
    var raw = null;
    try { raw = JSON.parse(lsGet('vs-last-' + sec) || 'null'); } catch (e) { raw = null; }
    if (!raw || raw.day !== day) return null;
    return raw;
  }

  function saveLastNumbers(sec, day, today, total) {
    try { lsSet('vs-last-' + sec, JSON.stringify({ day: day, today: today, total: total })); } catch (e) {}
  }

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent =
      '.visit-stats{margin:16px 0 0;padding-top:12px;border-top:1px solid rgba(120,130,145,.18);' +
      'font-size:12.5px;line-height:1.5;text-align:center;letter-spacing:-0.005em;color:inherit;' +
      'opacity:.72;font-variant-numeric:tabular-nums}' +
      '.visit-stats b{font-weight:700;opacity:.95}' +
      '.visit-stats .vs-dot{margin:0 6px;opacity:.55}';
    (document.head || document.documentElement).appendChild(st);
  }

  function render(today, total) {
    var footer = document.querySelector('footer');
    if (!footer) return;
    var host = footer.querySelector('.wrap') || footer;
    var el = host.querySelector('.visit-stats');
    if (!el) {
      el = document.createElement('p');
      el.className = 'visit-stats';
      host.appendChild(el);
    }
    while (el.firstChild) el.removeChild(el.firstChild);

    var b1 = document.createElement('b');
    b1.textContent = fmt(today);
    var dot = document.createElement('span');
    dot.className = 'vs-dot';
    dot.textContent = '·';
    var b2 = document.createElement('b');
    b2.textContent = fmt(total);

    el.appendChild(document.createTextNode('오늘 방문자 '));
    el.appendChild(b1);
    el.appendChild(document.createTextNode('명'));
    el.appendChild(dot);
    el.appendChild(document.createTextNode('누적 '));
    el.appendChild(b2);
    el.appendChild(document.createTextNode('명'));
    el.setAttribute('aria-label', '오늘 방문자 ' + today + '명, 누적 ' + total + '명');
  }

  function run() {
    addStyle();

    var sec = section();
    var day = dayKey();
    var todayKey = NS + '-' + sec + '-d-' + day;
    var totalKey = NS + '-' + sec + '-tt';
    var cacheKey = 'vs-cache-' + sec;
    var seenKey = 'vs-seen-' + sec;

    var cached = null;
    try { cached = JSON.parse(ssGet(cacheKey) || 'null'); } catch (e) { cached = null; }
    if (cached && cached.day === day && (Date.now() - cached.at) < CACHE_TTL) {
      render(cached.today, cached.total);
      return;
    }

    var work;
    if (lsGet(seenKey) === day) {
      work = Promise.all([attempt('get/' + todayKey), attempt('get/' + totalKey)]);
    } else {
      work = Promise.all([attempt('hit/' + todayKey), attempt('hit/' + totalKey)]).then(function (v) {
        lsSet(seenKey, day);
        return v;
      });
    }

    work.then(function (v) {
      render(v[0], v[1]);
      ssSet(cacheKey, JSON.stringify({ day: day, today: v[0], total: v[1], at: Date.now() }));
      saveLastNumbers(sec, day, v[0], v[1]);
    }).catch(function () {
      // 오늘 안에 성공했던 숫자가 있으면 그것을 그대로 보여 주고, 없으면 표시하지 않는다
      var last = lastNumbers(sec, day);
      if (last) render(last.today, last.total);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();

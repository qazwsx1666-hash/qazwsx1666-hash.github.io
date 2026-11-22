/* ==========================================================================
   건강·다이어트·수면 계산기 — app.js
   모든 계산은 브라우저 안에서만 이뤄집니다. (서버 전송·저장 없음)
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ utils */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function safe(id) { return document.getElementById(id); }
  function setText(id, text) { var el = safe(id); if (el) el.textContent = text; }
  function setHTML(id, html) { var el = safe(id); if (el) el.innerHTML = html; }
  function dec(v) {
    var t = String(v == null ? '' : v).replace(/,/g, '').replace(/[^0-9.\-]/g, '');
    var n = parseFloat(t);
    return isFinite(n) ? n : 0;
  }
  function fmt(n) {
    var x = Math.round(Number(n) || 0);
    return x.toLocaleString('ko-KR');
  }
  function fmt1(n) {
    var x = Math.round((Number(n) || 0) * 10) / 10;
    return x.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  }
  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function hhmm(minutes) {
    var m = ((Math.round(minutes) % 1440) + 1440) % 1440;
    return pad2(Math.floor(m / 60)) + ':' + pad2(m % 60);
  }
  function parseTime(str) {
    var m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(String(str || '').trim());
    if (!m) return null;
    var h = Number(m[1]), mi = Number(m[2]);
    if (h > 23 || mi > 59) return null;
    return h * 60 + mi;
  }
  function nowMinutes() {
    var d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
  function durationText(minutes) {
    var m = Math.max(0, Math.round(minutes));
    var h = Math.floor(m / 60), r = m % 60;
    if (h && r) return h + '시간 ' + r + '분';
    if (h) return h + '시간';
    return r + '분';
  }

  /* --------------------------------------------------------------- segments */
  var segState = {};

  function initSegments() {
    $$('.seg').forEach(function (seg) {
      var key = seg.getAttribute('data-seg');
      var active = seg.querySelector('button[aria-pressed="true"]') || seg.querySelector('button');
      segState[key] = active ? active.getAttribute('data-value') : null;
      seg.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        $$('button', seg).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        segState[key] = btn.getAttribute('data-value');
        computeAll();
      });
    });
  }

  /* ------------------------------------------------------------------ chips */
  function initChips() {
    $$('[data-chips]').forEach(function (box) {
      var target = safe(box.getAttribute('data-chips'));
      if (!target) return;
      box.addEventListener('click', function (e) {
        var btn = e.target.closest('.chip');
        if (!btn) return;
        target.value = btn.getAttribute('data-value');
        syncChips();
        computeAll();
      });
    });
  }
  function syncChips() {
    $$('[data-chips]').forEach(function (box) {
      var target = safe(box.getAttribute('data-chips'));
      if (!target) return;
      var v = String(target.value).trim();
      $$('.chip', box).forEach(function (c) {
        c.setAttribute('aria-pressed', c.getAttribute('data-value') === v ? 'true' : 'false');
      });
    });
  }

  /* ------------------------------------------------------------------ tabs */
  function initSubtabs() {
    $$('.subtabs').forEach(function (group) {
      var key = group.getAttribute('data-seg');
      if (key) {
        var cur = group.querySelector('button[aria-selected="true"]') || group.querySelector('button');
        if (cur) segState[key] = cur.getAttribute('data-sub');
      }
      group.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-sub]');
        if (!btn) return;
        var name = btn.getAttribute('data-sub');
        if (key) segState[key] = name;
        $$('button', group).forEach(function (b) {
          b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
        });
        var card = btn.closest('.card');
        $$('.subpanel', card).forEach(function (sp) {
          sp.classList.toggle('is-active', sp.id === 'sub-' + name);
        });
        computeAll();
      });
    });
  }

  /* ============================================================== 1) BMI */
  var BMI_SEGMENTS = [
    { key: 'low', lo: 0, hi: 18.5, label: '저체중' },
    { key: 'normal', lo: 18.5, hi: 23, label: '정상' },
    { key: 'over', lo: 23, hi: 25, label: '과체중' },
    { key: 'obese', lo: 25, hi: 30, label: '비만 1단계' },
    { key: 'obese2', lo: 30, hi: 99, label: '비만 2단계 이상' }
  ];

  function bmiGrade(bmi) {
    if (bmi < 18.5) {
      return { name: '저체중', tone: 'warn', low: 18.5, msg: '표준체중 범위보다 낮습니다. 무리한 감량보다 근육량과 식사량을 늘리는 쪽이 우선입니다.' };
    }
    if (bmi < 23) {
      return { name: '정상', tone: 'good', low: 18.5, msg: '아시아-태평양 기준 정상 범위(18.5~22.9)에 들어 있습니다. 지금 체중을 유지하는 것이 가장 좋습니다.' };
    }
    if (bmi < 25) {
      return { name: '과체중', tone: 'warn', low: 23, msg: '비만 전단계(23~24.9)입니다. 허리둘레와 체지방률을 함께 보면서 3~5% 감량을 목표로 해보세요.' };
    }
    if (bmi < 30) {
      return { name: '비만 1단계', tone: 'bad', low: 25, msg: '비만 1단계(25~29.9)입니다. 5~10% 감량만으로도 혈압·혈당·중성지방이 눈에 띄게 좋아집니다.' };
    }
    if (bmi < 35) {
      return { name: '비만 2단계', tone: 'bad', low: 30, msg: '비만 2단계(30~34.9)입니다. 식사·운동 조절과 함께 전문가 상담을 병행하는 것이 안전합니다.' };
    }
    return { name: '비만 3단계', tone: 'bad', low: 35, msg: '비만 3단계(35 이상)입니다. 동반 질환 위험이 커지므로 의료기관에서 개인별 평가를 받으세요.' };
  }

  function computeBMI() {
    if (!safe('inBmiHeight')) return;
    var h = dec((safe('inBmiHeight') || {}).value) / 100;
    var w = dec((safe('inBmiWeight') || {}).value);
    var badge = safe('outBmiGrade');
    if (!(h >= 1 && h <= 2.5) || !(w >= 20 && w <= 350)) {
      setText('outBmiValue', '—');
      if (badge) { badge.className = 'badge'; badge.textContent = '키와 체중을 입력하세요'; }
      setText('outBmiRead', '키는 100~250cm, 체중은 20~350kg 범위로 입력해 주세요.');
      ['outBmiNormal', 'outBmiIdeal', 'outBmiChange', 'outBmiFat'].forEach(function (id) { setText(id, '—'); });
      return;
    }
    var bmi = w / (h * h);
    var g = bmiGrade(bmi);
    var nLo = 18.5 * h * h, nHi = 22.9 * h * h;
    var ideal = 22 * h * h;
    var diff = w - ideal;

    setText('outBmiValue', bmi.toFixed(1));
    if (badge) {
      badge.className = 'badge ' + g.tone;
      badge.innerHTML = '<span class="dot"></span>' + g.name;
    }
    setText('outBmiNormal', fmt1(nLo) + '~' + fmt1(nHi) + ' kg');
    setText('outBmiIdeal', fmt1(ideal) + ' kg');
    setText('outBmiChange', (diff > 0 ? '-' : diff < 0 ? '+' : '') + fmt1(Math.abs(diff)) + ' kg');
    setText('outBmiRange', '18.5 ~ 22.9');

    var marker = safe('bmiMarker');
    if (marker) marker.style.left = clamp((bmi - 15) / 25 * 100, 0, 100) + '%';

    setText('outBmiRead', bmi.toFixed(1) + '은 ' + g.name + ' 구간입니다. ' + g.msg);
    setText('outBmiHint', '표준체중(22×키²) ' + fmt1(ideal) + 'kg 대비 ' +
      (diff > 0 ? fmt1(diff) + 'kg 무겁고' : diff < 0 ? fmt1(-diff) + 'kg 가볍고' : '차이가 없고') +
      ', 정상 범위 상한(22.9)까지는 ' + (diff > 0 ? fmt1(w - nHi) + 'kg' : '이미 범위 안') + '입니다.');

    var loB = safe('bmiBandLow'), hiB = safe('bmiBandHi');
    if (loB) loB.textContent = bmi < 18.5 ? '현재 위치' : '';
    if (hiB) hiB.textContent = bmi >= 18.5 && bmi < 23 ? '현재 위치' : '';
  }

  /* ============================================================== 2) BMR */
  var ACTIVITY = {
    '1.2': { name: '거의 움직이지 않음', sub: '재택·좌식' },
    '1.375': { name: '가벼운 활동', sub: '주 1~3회' },
    '1.55': { name: '보통 활동', sub: '주 3~5회' },
    '1.725': { name: '활발한 활동', sub: '주 6~7회' },
    '1.9': { name: '매우 활발', sub: '운동선수·육체노동' }
  };

  var MACROS = [
    { key: 'keep', name: '유지', delta: 0, ratio: { c: 50, p: 20, f: 30 }, note: '현재 체중을 그대로 유지' },
    { key: 'lose', name: '감량', delta: -500, ratio: { c: 40, p: 30, f: 30 }, note: '주 0.4~0.5kg 감량 속도' },
    { key: 'gain', name: '증량', delta: 300, ratio: { c: 55, p: 20, f: 25 }, note: '월 1kg 안팎의 완만한 증량' }
  ];

  function computeBMR() {
    if (!safe('inBmrWeight')) return;
    var male = segState.bmrGender !== 'female';
    var age = dec((safe('inBmrAge') || {}).value);
    var h = dec((safe('inBmrHeight') || {}).value);
    var w = dec((safe('inBmrWeight') || {}).value);
    var act = (safe('inBmrActivity') || {}).value || segState.bmrActivity || '1.55';

    if (!(age >= 14 && age <= 100) || !(h >= 100 && h <= 250) || !(w >= 25 && w <= 350)) {
      setText('outBmr', '—');
      setText('outTdee', '—');
      setText('outBmrHb', '—');
      setText('outBmrNote', '나이(14~100세), 키(100~250cm), 체중(25~350kg)을 확인해 주세요.');
      setHTML('outGoalRows', '');
      return;
    }

    var bmr = 10 * w + 6.25 * h - 5 * age + (male ? 5 : -161);
    var tdee = bmr * Number(act);
    /* Harris-Benedict(개정식) 참고값 */
    var hb = male
      ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * age
      : 447.593 + 9.247 * w + 3.098 * h - 4.330 * age;

    setText('outBmr', fmt(bmr) + ' kcal');
    setText('outTdee', fmt(tdee) + ' kcal');
    setText('outBmrHb', fmt(hb) + ' kcal');
    setText('outBmrAct', ACTIVITY[act] ? ACTIVITY[act].name : '');
    setText('outBmrPerKg', fmt1(bmr / w) + ' kcal/kg');

    var floor = male ? 1500 : 1200;
    var rows = '';
    MACROS.forEach(function (m) {
      var kcal = m.delta === 0 ? tdee : tdee + m.delta;
      if (kcal < floor) kcal = floor;
      var cg = Math.round(kcal * m.ratio.c / 100 / 4);
      var pg = Math.round(kcal * m.ratio.p / 100 / 4);
      var fg = Math.round(kcal * m.ratio.f / 100 / 9);
      rows += '<tr' + (m.key === 'keep' ? ' class="is-best"' : '') + '>' +
        '<td><strong>' + m.name + '</strong><small>' + m.note + '</small></td>' +
        '<td><strong>' + fmt(kcal) + '</strong><small>kcal</small></td>' +
        '<td>' + cg + 'g<small>' + m.ratio.c + '%</small></td>' +
        '<td>' + pg + 'g<small>' + m.ratio.p + '%</small></td>' +
        '<td>' + fg + 'g<small>' + m.ratio.f + '%</small></td>' +
        '</tr>';
    });
    setHTML('outGoalRows', rows);

    var kgP = male ? 1.6 : 1.6;
    setText('outBmrProtein', fmt1(w * kgP) + '~' + fmt1(w * 2.0) + ' g');
    setText('outBmrMeal', fmt(Math.round(w * 1.6 / 3)) + ' g');

    var macro = MACROS[0];
    var barC = safe('macroCarb'), barP = safe('macroProt'), barF = safe('macroFat');
    if (barC) barC.style.width = macro.ratio.c + '%';
    if (barP) barP.style.width = macro.ratio.p + '%';
    if (barF) barF.style.width = macro.ratio.f + '%';
    setText('macroCarbG', fmt(tdee * macro.ratio.c / 100 / 4) + 'g');
    setText('macroProtG', fmt(tdee * macro.ratio.p / 100 / 4) + 'g');
    setText('macroFatG', fmt(tdee * macro.ratio.f / 100 / 9) + 'g');

    setText('outBmrNote', '활동량 계수 ' + act + ' (' + (ACTIVITY[act] ? ACTIVITY[act].name : '') + ') 기준입니다. ' +
      '감량 칼로리는 하루 ' + fmt(floor) + 'kcal 아래로 내려가지 않도록 막아 두었습니다.');
  }

  /* ============================================================= 3) Sleep */
  var CYCLE = 90, ONSET = 15;

  function sleepDayLabel(shift, base) {
    if (base === 'wake') {
      if (shift === 0) return '당일';
      if (shift === -1) return '전날 밤';
      return shift < 0 ? Math.abs(shift) + '일 전' : shift + '일 뒤';
    }
    if (shift === 0) return '당일';
    if (shift === 1) return '다음날';
    return shift < 0 ? Math.abs(shift) + '일 전' : shift + '일 뒤';
  }

  function buildSleepList(base, mode) {
    var list = safe('outSleepList');
    if (!list) return;
    var times = mode === 'wake' ? [6, 5, 4] : [4, 5, 6];
    var html = '';
    times.forEach(function (n) {
      var dur = CYCLE * n;
      var total = dur + ONSET;
      var raw = mode === 'wake' ? base - total : base + total;
      var shift = Math.floor(raw / 1440);
      var label = sleepDayLabel(shift, mode);
      var best = n === 5;
      var main = hhmm(raw);
      var sub = (mode === 'wake' ? '취침' : '기상') + ' · 수면 ' + durationText(dur);
      var tag = n === 5 ? '추천 5주기' : n === 4 ? '최소 4주기' : '6주기';
      html += '<button type="button" class="' + (best ? 'is-best' : '') + '" data-time="' + main + '" data-cycles="' + n + '" data-mode="' + mode + '">' +
        '<span class="t-main"><span class="t-time">' + main + '<small>' + label + '</small></span>' +
        '<span class="t-sub">' + sub + ' · ' + n + '주기(90분×' + n + ') + 잠드는 시간 15분</span></span>' +
        '<span class="t-badge">' + tag + '</span></button>';
    });
    list.innerHTML = html;

    var first = list.querySelector('button.is-best') || list.querySelector('button');
    if (first) {
      first.classList.add('is-picked');
      setText('outSleepSummary', mode === 'wake'
        ? '기상 ' + hhmm(base) + ' 기준, 가장 무난한 취침 시각은 ' + hhmm(base - (CYCLE * 5 + ONSET)) + '입니다.'
        : '취침 ' + hhmm(base) + ' 기준, 5주기 뒤 기상은 ' + hhmm(base + CYCLE * 5 + ONSET) + '입니다.');
    }
  }

  function computeSleep() {
    if (!safe('inSleepWake')) return;
    var wakeMode = segState.sleepMode !== 'bed';
    var baseStr = (safe(wakeMode ? 'inSleepWake' : 'inSleepBed') || {}).value;
    var base = parseTime(baseStr);
    if (base == null) {
      setHTML('outSleepList', '<p class="subtle">시간을 선택하면 추천 시각이 나옵니다.</p>');
      setText('outSleepSummary', '');
      return;
    }
    buildSleepList(base, wakeMode ? 'wake' : 'bed');
  }

  function initSleepExtras() {
    var list = safe('outSleepList');
    if (list) {
      list.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-time]');
        if (!btn) return;
        $$('button', list).forEach(function (b) { b.classList.remove('is-picked'); });
        btn.classList.add('is-picked');
        setText('outSleepSummary', '선택한 시각은 ' + btn.getAttribute('data-time') + '입니다. 알람을 그 시각에 맞춰 두세요.');
      });
    }
    var nowBtn = safe('btnSleepNow');
    if (nowBtn) {
      nowBtn.addEventListener('click', function () {
        var now = nowMinutes();
        /* 취침 모드로 전환하고 현재 시각을 넣는다 */
        var tab = $('.subtabs button[data-sub="bed"]');
        if (tab) tab.click();
        var input = safe('inSleepBed');
        if (input) { input.value = hhmm(now); }
        computeAll();
        setText('outSleepSummary', '지금(' + hhmm(now) + ') 잠들면 5주기 뒤 ' + hhmm(now + CYCLE * 5 + ONSET) + '에 일어나면 됩니다.');
      });
    }
    var share = safe('btnSleepShare');
    if (share) {
      share.addEventListener('click', function () {
        var picked = safe('outSleepList') ? $('button.is-picked', safe('outSleepList')) : null;
        var cycles = picked ? Number(picked.getAttribute('data-cycles')) || 5 : 5;
        var wakeMode = segState.sleepMode !== 'bed';
        var baseStr = (safe(wakeMode ? 'inSleepWake' : 'inSleepBed') || {}).value;
        var base = parseTime(baseStr);
        var dur = CYCLE * cycles;
        var url = location.href.split('#')[0];
        var text = '수면 사이클 계산';
        if (base != null) {
          if (wakeMode) {
            text = '기상 ' + hhmm(base) + ' → 취침 ' + hhmm(base - (dur + ONSET)) + ' (' + cycles + '주기, ' + durationText(dur) + ' 수면) · ' + url;
          } else {
            text = '취침 ' + hhmm(base) + ' → 기상 ' + hhmm(base + dur + ONSET) + ' (' + cycles + '주기, ' + durationText(dur) + ' 수면) · ' + url;
          }
        }
        shareText(text, 'outSleepToast');
      });
    }
  }

  function shareText(text, toastId) {
    function done(msg) {
      setText(toastId, msg);
      window.setTimeout(function () { setText(toastId, ''); }, 3200);
    }
    if (navigator.share) {
      navigator.share({ title: document.title, text: text }).then(function () {
        done('공유 창을 열었습니다.');
      }).catch(function () {
        copyFallback();
      });
    } else {
      copyFallback();
    }
    function copyFallback() {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done('복사했습니다. 원하는 곳에 붙여넣으세요.'); },
          function () { done(text); });
      } else {
        done(text);
      }
    }
  }

  /* ========================================================== 4) Caffeine */
  var DRINK = { name: '아메리카노', mg: 150, serve: '355ml 1잔' };

  function computeCaffeine() {
    if (!safe('inCaffQty')) return;
    var qty = clamp(dec((safe('inCaffQty') || {}).value), 0, 20);
    var half = dec(segState.caffHalf || '5') || 5;
    var timeStr = (safe('inCaffTime') || {}).value;
    var t0 = parseTime(timeStr);
    if (t0 == null) {
      setText('outCaffTotal', '—');
      setText('outCaffNow', '—');
      setText('outCaffSafe', '—');
      return;
    }

    var total = DRINK.mg * qty;
    if (total <= 0) {
      setText('outCaffTotal', '0 mg');
      setText('outCaffNow', '0 mg');
      setText('outCaffPercent', '—');
      setText('outCaffElapsed', '—');
      setText('outCaffSafe', '—');
      setText('outCaffSafe100', '—');
      setText('outCaffSafe30', '—');
      setText('outCaffLimit', '잔 수를 1잔 이상 입력하면 하루 권장 상한까지 남은 양을 계산합니다.');
      setHTML('outCaffChart', '');
      setText('outCaffNote', '음료와 잔 수를 선택하세요.');
      return;
    }
    var now = nowMinutes();
    var elapsed = now - t0;
    if (elapsed < 0) elapsed += 1440; /* 오늘 아직 안 마신 시각이면 어제 마신 것으로 본다 */

    var remain = total * Math.pow(0.5, elapsed / half);

    setText('outCaffTotal', fmt(total) + ' mg');
    setText('outCaffNow', fmt(remain) + ' mg');
    setText('outCaffPercent', Math.round(remain / total * 100) + '%');
    setText('outCaffElapsed', durationText(elapsed) + ' 경과');
    setText('outCaffDrink', DRINK.name + ' ' + qty + '잔 (' + DRINK.serve + ' 기준)');
    setText('outCaffHalfLabel', '반감기 ' + half + '시간');

    /* 잔존량이 기준 이하로 떨어지는 시각 */
    function timeUnder(threshold) {
      if (total <= threshold) return hhmm(t0);
      var h = half * Math.log(total / threshold) / Math.LN2;
      return hhmm(t0 + h * 60);
    }
    setText('outCaffSafe', timeUnder(50));
    setText('outCaffSafe100', timeUnder(100));
    setText('outCaffSafe30', timeUnder(30));

    var over = total > 400;
    setText('outCaffLimit', over
      ? '하루 400mg을 넘었습니다. 남은 하루는 카페인 없는 음료로 채우세요.'
      : '하루 권장 상한 400mg까지 ' + fmt(400 - total) + 'mg 남았습니다.');

    var svg = caffeineChart(total, half, t0, elapsed, remain);
    setHTML('outCaffChart', svg);
    setText('outCaffNote', '현재 잔존량은 ' + DRINK.name + ' ' + qty + '잔(' + fmt(total) + 'mg)을 ' +
      hhmm(t0) + '에 마시고 ' + durationText(elapsed) + ' 지난 시점의 추정치입니다. 반감기 ' + half + '시간 적용.');
  }

  function caffeineChart(total, half, t0, elapsed, remain) {
    var box = safe('outCaffChart');
    var W = Math.max(280, Math.min(760, (box && box.clientWidth) || 560));
    var H = Math.max(170, Math.min(250, Math.round(W * 0.42)));
    var L = 46, R = 12, T = 18, B = 28;
    var hours = 12;
    var yMax = Math.max(100, Math.ceil(total / 100) * 100);
    function X(hr) { return L + (W - L - R) * hr / hours; }
    function Y(mg) { return T + (H - T - B) * (1 - clamp(mg / yMax, 0, 1)); }

    var pts = [];
    for (var hr = 0; hr <= hours; hr += 0.5) {
      pts.push(X(hr).toFixed(1) + ',' + Y(total * Math.pow(0.5, hr / half)).toFixed(1));
    }
    var area = X(0).toFixed(1) + ',' + Y(0).toFixed(1) + ' ' + pts.join(' ') + ' ' + X(hours).toFixed(1) + ',' + Y(0).toFixed(1);

    var grid = '', i;
    for (i = 0; i <= 4; i++) {
      var f = i / 4;
      var y = T + (H - T - B) * f;
      grid += '<line x1="' + L + '" y1="' + y.toFixed(1) + '" x2="' + (W - R) + '" y2="' + y.toFixed(1) + '" stroke="#eef1f4" stroke-width="1"/>';
      grid += '<text x="' + (L - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="#8b95a1">' + fmt(yMax * (1 - f)) + '</text>';
    }

    var xlab = '';
    for (i = 0; i <= hours; i += 2) {
      xlab += '<text x="' + X(i).toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle" font-size="11" fill="#8b95a1">' + i + '시간</text>';
    }

    var safeHr = total > 50 ? half * Math.log(total / 50) / Math.LN2 : 0;
    var safeLine = safeHr <= hours
      ? '<line x1="' + X(safeHr).toFixed(1) + '" y1="' + T + '" x2="' + X(safeHr).toFixed(1) + '" y2="' + (H - B) + '" stroke="#12b76a" stroke-width="1.5" stroke-dasharray="4 4"/>' +
        '<text x="' + clamp(X(safeHr) + 5, L, W - R - 64) + '" y="' + (T + 12) + '" font-size="11" font-weight="700" fill="#0b8b52">안전 ' + hhmm(t0 + safeHr * 60) + '</text>'
      : '';

    var nowDot = elapsed <= hours * 60
      ? '<circle cx="' + X(elapsed / 60).toFixed(1) + '" cy="' + Y(remain).toFixed(1) + '" r="4" fill="#0f8f7f" stroke="#fff" stroke-width="2"/>'
      : '';

    return '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="카페인 잔존량 그래프">' +
      grid +
      '<line x1="' + L + '" y1="' + (H - B) + '" x2="' + (W - R) + '" y2="' + (H - B) + '" stroke="#d7dce1" stroke-width="1"/>' +
      '<line x1="' + L + '" y1="' + T + '" x2="' + L + '" y2="' + (H - B) + '" stroke="#d7dce1" stroke-width="1"/>' +
      '<polygon points="' + area + '" fill="rgba(20,184,166,0.12)"/>' +
      '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#14b8a6" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<line x1="' + L + '" y1="' + Y(50).toFixed(1) + '" x2="' + (W - R) + '" y2="' + Y(50).toFixed(1) + '" stroke="#37c98a" stroke-width="1" stroke-dasharray="2 4" opacity="0.8"/>' +
      safeLine + nowDot + xlab +
      '</svg>';
  }

  function initDrink() {
    var gridEl = safe('drinkGrid');
    if (!gridEl) return;
    gridEl.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-mg]');
      if (!btn) return;
      $$('button', gridEl).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', 'true');
      DRINK = {
        name: btn.getAttribute('data-name'),
        mg: Number(btn.getAttribute('data-mg')) || 0,
        serve: btn.getAttribute('data-serve') || ''
      };
      setText('outCaffDrinkName', DRINK.name + ' 1잔 ' + DRINK.mg + 'mg');
      computeAll();
    });
  }

  /* ============================================================= 5) Water */
  var PROTEIN = {
    keep: { name: '유지', lo: 1.0, hi: 1.4, note: '일반 성인·가벼운 운동' },
    lose: { name: '감량', lo: 1.6, hi: 2.0, note: '근손실을 줄이는 감량' },
    gain: { name: '증량', lo: 1.6, hi: 2.2, note: '근육을 늘리는 증량' }
  };

  function computeWater() {
    if (!safe('inWaterWeight')) return;
    var w = dec((safe('inWaterWeight') || {}).value);
    var ex = clamp(dec((safe('inWaterExercise') || {}).value), 0, 480);
    var goal = segState.waterGoal || 'keep';
    if (!(w >= 25 && w <= 350)) {
      setText('outWaterMl', '—');
      setText('outWaterBottles', '—');
      setText('outProteinG', '—');
      setText('outWaterNote', '체중을 25~350kg 범위로 입력해 주세요.');
      return;
    }

    var baseLo = w * 30, baseHi = w * 35;
    var exAdd = ex / 60 * 500;
    var lo = baseLo + exAdd, hi = baseHi + exAdd;

    setText('outWaterMl', fmt(lo) + '~' + fmt(hi) + ' ml');
    setText('outWaterBase', fmt(baseLo) + '~' + fmt(baseHi) + ' ml');
    setText('outWaterEx', ex > 0 ? '+' + fmt(exAdd) + ' ml' : '운동 없음');
    setText('outWaterBottles', fmt1(lo / 500) + '~' + fmt1(hi / 500) + '병');
    setText('outWaterBottleCount', Math.ceil(hi / 500) + '병');
    setText('outWaterCups', fmt(Math.ceil(lo / 200)) + '~' + fmt(Math.ceil(hi / 200)) + '잔');

    var p = PROTEIN[goal] || PROTEIN.keep;
    setText('outProteinG', fmt(w * p.lo) + '~' + fmt(w * p.hi) + ' g');
    setText('outProteinRange', (p.lo) + '~' + (p.hi) + 'g/kg 기준');
    setText('outProteinPerMeal', fmt(Math.round(w * (p.lo + p.hi) / 2 / 3)) + ' g');
    setText('outProteinGoal', p.name + ' · ' + p.note);
    setText('outWaterNote', '체중 ' + fmt1(w) + 'kg · 운동 ' + ex + '분 · 목표 ' + p.name +
      ' 기준입니다. 더운 날이나 땀을 많이 흘린 날은 500ml 안팎을 더하세요.');

    /* 물병 시각화: 500ml 병 수(내림 + 반병) */
    var full = Math.floor(lo / 500);
    var rest = lo - full * 500;
    var html = '', i;
    for (i = 0; i < Math.min(full, 12); i++) html += '<span class="bottle"><i></i></span>';
    if (rest >= 150 && full < 12) html += '<span class="bottle is-half"><i></i></span>';
    if (full > 12) html += '<span class="subtle">+' + (full - 12) + '병</span>';
    setHTML('outWaterBottlesVisual', html);
  }

  /* ========================================================== orchestration */
  function computeAll() {
    try { computeBMI(); } catch (e) { /* noop */ }
    try { computeBMR(); } catch (e) { /* noop */ }
    try { computeSleep(); } catch (e) { /* noop */ }
    try { computeCaffeine(); } catch (e) { /* noop */ }
    try { computeWater(); } catch (e) { /* noop */ }
  }

  function initInputs() {
    $$('input, select').forEach(function (el) {
      el.addEventListener('input', computeAll);
      el.addEventListener('change', computeAll);
    });
  }

  function init() {
    var ct = safe('inCaffTime');
    if (ct && !ct.value) ct.value = hhmm(nowMinutes());
    initSegments();
    initChips();
    initSubtabs();
    initDrink();
    initSleepExtras();
    initInputs();
    /* 첫 렌더: 값이 있는 계산기만 결과를 채운다 */
    computeAll();
    syncChips();
  }

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(computeAll, 180);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

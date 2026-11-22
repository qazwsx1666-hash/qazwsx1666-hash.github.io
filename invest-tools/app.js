/* ==========================================================================
   주식·투자 계산기 — app.js
   모든 계산은 브라우저 안에서만 이뤄집니다. (서버 전송·저장 없음)
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ utils */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function safe(id) { return document.getElementById(id); }
  function setText(id, text) { var el = safe(id); if (el) el.textContent = text; }
  function setHTML(id, html) { var el = safe(id); if (el) el.innerHTML = html; }

  function digits(v) { return String(v == null ? '' : v).replace(/[^0-9]/g, ''); }

  function money(id) {
    var t = digits(safe(id) ? safe(id).value : '');
    if (!t) return 0;
    return Math.min(Number(t), 1e13);
  }
  function decv(id) {
    var el = safe(id);
    if (!el) return 0;
    var t = String(el.value).replace(/,/g, '').replace(/[^0-9.\-]/g, '');
    var n = parseFloat(t);
    return isFinite(n) ? n : 0;
  }
  function fmt(n) {
    var x = Math.round(Number(n) || 0);
    if (!isFinite(x)) return '0';
    return x.toLocaleString('ko-KR');
  }
  function won(n) { return fmt(n) + ' 원'; }
  function pct(n, d) {
    var x = Number(n) || 0;
    var s = x.toFixed(typeof d === 'number' ? d : 2);
    if (s.indexOf('.') !== -1) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s + '%';
  }
  function pctFixed(n, d) { return (Number(n) || 0).toFixed(d) + '%'; }
  function readWon(n) {
    var x = Number(n) || 0;
    var neg = x < 0;
    var a = Math.abs(Math.round(x));
    var s = '';
    var approx = false;
    if (a === 0) return '0 원';
    if (a >= 100000000) {
      var eok = Math.floor(a / 100000000);
      var man = Math.floor((a % 100000000) / 10000);
      s = eok + '억' + (man > 0 ? ' ' + fmt(man) + '만' : '') + ' 원';
      approx = (a % 10000) !== 0;
    } else if (a >= 10000) {
      var manR = Math.round(a / 10000);
      s = fmt(manR) + '만 원';
      approx = Math.abs(manR * 10000 - a) >= 1;
    } else {
      s = fmt(a) + ' 원';
    }
    return (neg ? '-' : '') + (approx ? '약 ' : '') + s;
  }
  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function periodLabel(m) {
    if (m === null || m === undefined) return '계산 불가';
    if (m === 0) return '이미 달성';
    var y = Math.floor(m / 12), mo = m % 12;
    if (y === 0) return mo + '개월';
    return y + '년' + (mo > 0 ? ' ' + mo + '개월' : '');
  }

  /* --------------------------------------------------------- 입력값 포맷팅 */
  function formatMoneyInput(el) {
    var raw = el.value;
    var caret = raw.length;
    try { caret = el.selectionStart == null ? raw.length : el.selectionStart; } catch (e) { caret = raw.length; }
    var before = (raw.slice(0, caret).match(/[0-9]/g) || []).length;
    var t = raw.replace(/[^0-9]/g, '').slice(0, 15);
    var out = t ? Number(t).toLocaleString('en-US') : '';
    el.value = out;
    if (document.activeElement === el) {
      var pos = 0, seen = 0;
      while (pos < out.length && seen < before) {
        if (/[0-9]/.test(out[pos])) seen++;
        pos++;
      }
      try { el.setSelectionRange(pos, pos); } catch (e) { /* noop */ }
    }
  }
  function formatDecInput(el) {
    var raw = el.value.replace(/[^0-9.]/g, '');
    var first = raw.indexOf('.');
    if (first !== -1) {
      raw = raw.slice(0, first + 1) + raw.slice(first + 1).replace(/\./g, '');
    }
    var parts = raw.split('.');
    if (parts.length > 1) raw = parts[0] + '.' + parts[1].slice(0, 4);
    el.value = raw;
  }

  /* --------------------------------------------------------- 세그먼트 상태 */
  var segState = {};

  function seg(key) { return segState[key]; }

  function onChangeSeg(key) {
    if (key === 'invSolve') {
      var qtyMode = segState.invSolve === 'qty';
      var fPrice = safe('fieldInvAddPrice');
      var fQty = safe('fieldInvAddQty');
      if (fPrice) fPrice.classList.toggle('is-hidden', !qtyMode);
      if (fQty) fQty.classList.toggle('is-hidden', qtyMode);
      setText('lblInvMain', qtyMode ? '필요한 추가 매수 수량' : '필요한 추가 매수 단가');
      setText('lblInvDesc', qtyMode ? '목표 평단가와 추가 매수 단가로 필요한 수량을 구합니다.' : '목표 평단가와 추가 매수 수량으로 필요한 단가를 구합니다.');
    }
  }

  function initSegments() {
    $$('.seg').forEach(function (segEl) {
      var key = segEl.getAttribute('data-seg');
      var active = segEl.querySelector('button[aria-pressed="true"]') || segEl.querySelector('button');
      segState[key] = active ? active.getAttribute('data-value') : null;
      segEl.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        $$('button', segEl).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        segState[key] = btn.getAttribute('data-value');
        onChangeSeg(key);
        computeAll();
      });
    });
    Object.keys(segState).forEach(onChangeSeg);
  }

  /* ------------------------------------------------------------- 서브 패널 */
  function initSubtabs() {
    $$('[data-subtabs]').forEach(function (bar) {
      bar.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-sub]');
        if (!btn) return;
        $$('button', bar).forEach(function (b) { b.setAttribute('aria-selected', 'false'); });
        btn.setAttribute('aria-selected', 'true');
        var name = btn.getAttribute('data-sub');
        $$('[data-subpanel]').forEach(function (p) {
          p.classList.toggle('is-active', p.getAttribute('data-subpanel') === name);
        });
        computeAll();
      });
    });
  }

  /* --------------------------------------------------------------- 칩(빠른값) */
  function initChips() {
    $$('[data-chips]').forEach(function (box) {
      var target = safe(box.getAttribute('data-chips'));
      if (!target) return;
      box.addEventListener('click', function (e) {
        var btn = e.target.closest('.chip');
        if (!btn) return;
        target.value = btn.getAttribute('data-value');
        if (target.classList.contains('js-money')) formatMoneyInput(target);
        if (target.classList.contains('js-dec')) formatDecInput(target);
        computeAll();
      });
    });
  }

  /* ========================================================================
     1. 물타기 · 평단가
     ====================================================================== */
  function computeAveraging() {
    var q0 = Math.floor(money('inAvgQty'));
    var p0 = money('inAvgPrice');
    var q1 = Math.floor(money('inAddQty'));
    var p1 = money('inAddPrice');
    var now = money('inAvgNow');

    var q2 = q0 + q1;
    var cost0 = q0 * p0;
    var cost1 = q1 * p1;
    var total = cost0 + cost1;
    var avg = q2 > 0 ? total / q2 : 0;

    setText('outAvgNew', won(avg));
    setText('outAvgRead', readWon(avg));
    setText('outAvgQty', fmt(q2) + ' 주');
    setText('outAvgTotal', won(total));
    setText('outAvgExtra', won(cost1));

    var cut = p0 > 0 ? ((p0 - avg) / p0) * 100 : 0;
    setText('outAvgCut', pct(cut, 2));
    setText('outAvgBreak', q2 > 0 ? fmt(Math.ceil(avg)) + ' 원' : '-');

    var bounce = null;
    if (now > 0 && avg > 0) bounce = ((avg - now) / now) * 100;
    if (bounce === null) setText('outAvgBounce', '-');
    else if (bounce <= 0) setText('outAvgBounce', '이미 이익권');
    else setText('outAvgBounce', pct(bounce, 2));

    var v = safe('outAvgVerdict');
    if (v) {
      var cls = 'badge', msg = '';
      if (q2 <= 0) { msg = '보유 수량을 입력하세요'; }
      else if (cut > 0.01) {
        cls = 'badge good';
        msg = '평단가 ' + pct(cut, 2) + ' 인하 · 추가 투자 ' + readWon(cost1);
      } else if (cut < -0.01) {
        cls = 'badge warn';
        msg = '평단가 ' + pct(-cut, 2) + ' 상승 (고가 추가 매수)';
      } else {
        cls = 'badge';
        msg = '평단가 변화 없음';
      }
      v.className = 'verdict';
      v.innerHTML = '<span class="' + cls + '"><span class="dot"></span>' + msg + '</span>';
    }

    // 평단가 비교 막대
    var maxV = Math.max(p0, avg, now, 1);
    setText('barOldVal', won(p0));
    setText('barNewVal', won(avg));
    setText('barNowVal', now > 0 ? won(now) : '-');
    var bOld = safe('barOld'), bNew = safe('barNew'), bNow = safe('barNow');
    if (bOld) bOld.style.width = clamp((p0 / maxV) * 100, 0, 100) + '%';
    if (bNew) bNew.style.width = clamp((avg / maxV) * 100, 0, 100) + '%';
    if (bNow) bNow.style.width = now > 0 ? clamp((now / maxV) * 100, 0, 100) + '%' : '0%';

    // 추가 매수 단가 시나리오
    var rows = '';
    if (q1 > 0 && p1 > 0) {
      var cuts = [0.05, 0.1, 0.15, 0.2, 0.3];
      cuts.forEach(function (c) {
        var ap = Math.round(p1 * (1 - c));
        var navg = (cost0 + q1 * ap) / q2;
        var need = now > 0 ? ((navg - now) / now) * 100 : null;
        rows += '<tr>' +
          '<td>' + fmt(ap) + ' 원 <span class="tag">-' + Math.round(c * 100) + '%</span></td>' +
          '<td><strong>' + fmt(navg) + ' 원</strong></td>' +
          '<td>' + fmt(total) + ' 원</td>' +
          '<td>' + (need === null ? '-' : (need <= 0 ? '이익권' : pct(need, 1))) + '</td>' +
          '</tr>';
      });
      rows += '<tr class="is-cur"><td>입력한 단가</td><td><strong>' + fmt(avg) + ' 원</strong></td><td>' + fmt(total) + ' 원</td>' +
        '<td>' + (bounce === null ? '-' : (bounce <= 0 ? '이익권' : pct(bounce, 1))) + '</td></tr>';
    }
    setHTML('outAvgRows', rows || '<tr><td colspan="4">추가 매수 수량과 단가를 입력하면 시나리오가 표시됩니다.</td></tr>');

    /* ---- 역산 ---- */
    var iq = Math.floor(money('inInvQty'));
    var ip = money('inInvPrice');
    var it = money('inInvTarget');
    var mode = segState.invSolve || 'qty';
    var addPrice = money('inInvAddPrice');
    var addQty = Math.floor(money('inInvAddQty'));
    var noteEl = safe('invNotice');
    var bad = [];
    var needQty = null, needPrice = null, invest = null;

    if (iq <= 0 || ip <= 0 || it <= 0) {
      bad.push('보유 수량·보유 평단가·목표 평단가를 모두 입력하세요.');
    } else if (it >= ip) {
      bad.push('목표 평단가는 보유 평단가보다 낮아야 합니다.');
    } else if (mode === 'qty') {
      if (addPrice <= 0) bad.push('추가 매수 단가를 입력하세요.');
      else if (addPrice >= it) bad.push('추가 매수 단가는 목표 평단가보다 낮아야 합니다.');
      else {
        needQty = (iq * (ip - it)) / (it - addPrice);
        invest = needQty * addPrice;
      }
    } else {
      if (addQty <= 0) bad.push('추가 매수 수량을 입력하세요.');
      else {
        needPrice = (it * (iq + addQty) - iq * ip) / addQty;
        if (needPrice <= 0) { bad.push('입력한 수량으로는 목표 평단가에 도달할 수 없습니다.'); needPrice = null; }
        invest = addQty * (needPrice || 0);
      }
    }

    if (mode === 'qty') {
      setText('outInvMain', needQty === null ? '-' : fmt(Math.ceil(needQty)) + ' 주');
      setText('outInvMainRead', needQty === null ? '-' : readWon(invest));
      setText('outInvQty', needQty === null ? '-' : fmt(Math.ceil(needQty)) + ' 주');
      setText('outInvPrice', fmt(addPrice) + ' 원');
      setText('outInvTotalQty', needQty === null ? '-' : fmt(iq + Math.ceil(needQty)) + ' 주');
    } else {
      setText('outInvMain', needPrice === null ? '-' : fmt(Math.ceil(needPrice)) + ' 원');
      setText('outInvMainRead', needPrice === null ? '-' : readWon(invest));
      setText('outInvQty', fmt(addQty) + ' 주');
      setText('outInvPrice', needPrice === null ? '-' : fmt(Math.ceil(needPrice)) + ' 원');
      setText('outInvTotalQty', fmt(iq + addQty) + ' 주');
    }
    setText('outInvAmount', invest === null ? '-' : won(invest));
    setText('outInvNewAvg', it > 0 ? fmt(it) + ' 원' : '-');

    if (noteEl) {
      if (bad.length) {
        noteEl.className = 'notice bad';
        noteEl.textContent = bad.join(' ');
      } else {
        noteEl.className = 'notice info';
        noteEl.textContent = '계산 결과는 수수료·세금을 제외한 단순 평균입니다. 실제 체결 단가와 수수료에 따라 평단가는 조금 달라집니다.';
      }
    }
  }

  /* ========================================================================
     2. 월 배당금
     ====================================================================== */
  var DIV_TAX = 0.154;

  function monthsToGoal(goal, start, monthly, annualGrowth) {
    if (start >= goal) return 0;
    var r = annualGrowth > 0 ? Math.pow(1 + annualGrowth, 1 / 12) - 1 : 0;
    var P = start;
    for (var i = 1; i <= 1200; i++) {
      P = P * (1 + r) + monthly;
      if (P >= goal) return i;
    }
    return null;
  }

  function computeDividend() {
    var target = money('inDivTarget');
    var y = decv('inDivYield');
    var monthly = money('inDivMonthly');
    var cur = money('inDivNow');
    var growth = decv('inDivGrowth') / 100;
    var yRate = Math.max(0, y) / 100;
    var netR = 1 - DIV_TAX;

    var need = yRate > 0 ? (target * 12) / netR / yRate : 0;
    var grossAnnual = need * yRate;
    var months = yRate > 0 ? monthsToGoal(need, cur, monthly, growth) : null;

    setText('outDivNeed', won(need));
    setText('outDivRead', yRate > 0 ? readWon(need) : '연 배당수익률을 입력하세요');
    setText('outDivGross', won(grossAnnual));
    setText('outDivTax', won(grossAnnual * DIV_TAX));
    setText('outDivNetMonthly', won((grossAnnual * netR) / 12));
    setText('outDivMonths', months === null ? '달성 불가' : periodLabel(months));
    setText('outDivNowMonthly', won((cur * yRate * netR) / 12));
    setText('outDivRemain', won(Math.max(0, need - cur)));
    setText('outDivMonthlyOut', won(monthly));
    setText('outDivYearsTxt', months === null ? '월 적립액을 늘리거나 수익률을 높여야 합니다' : (months === 0 ? '이미 목표를 넘었습니다' : periodLabel(months) + ' 뒤'));

    var v = safe('outDivVerdict');
    if (v) {
      var cls = 'badge', msg = '';
      if (yRate <= 0) { msg = '연 배당수익률을 입력하세요'; cls = 'badge warn'; }
      else if (need <= cur) { cls = 'badge good'; msg = '현재 자산으로 이미 목표 달성'; }
      else if (months === null) { cls = 'badge warn'; msg = '월 적립 ' + readWon(monthly) + '으로는 100년 내 달성 어려움'; }
      else { cls = 'badge'; msg = '필요 투자금 ' + readWon(need) + ' · 달성까지 ' + periodLabel(months); }
      v.className = 'verdict';
      v.innerHTML = '<span class="' + cls + '"><span class="dot"></span>' + msg + '</span>';
    }

    // 목표 월 배당별 필요 투자금
    var rows = '';
    [500000, 1000000, 1500000, 2000000, 3000000].forEach(function (t) {
      var n = yRate > 0 ? (t * 12) / netR / yRate : 0;
      var best = Math.abs(t - target) < 1 ? ' class="is-cur"' : '';
      rows += '<tr' + best + '><td>' + fmt(t / 10000) + '만 원</td><td><strong>' + fmt(n) + ' 원</strong></td>' +
        '<td>' + fmt((t * 12) / netR) + ' 원</td><td>' + readWon(n) + '</td></tr>';
    });
    setHTML('outDivTargetRows', rows);

    // 연도별 마일스톤
    var yList = [1, 3, 5, 10, 15, 20, 25, 30, 40];
    var P = cur;
    var r = growth > 0 ? Math.pow(1 + growth, 1 / 12) - 1 : 0;
    var snap = [];
    var maxY = yList[yList.length - 1];
    for (var yr = 1; yr <= maxY; yr++) {
      for (var k = 0; k < 12; k++) { P = P * (1 + r) + monthly; }
      if (yList.indexOf(yr) !== -1) snap.push({ y: yr, v: P });
    }
    var hit = false, yrows = '';
    snap.forEach(function (s) {
      var mNet = (s.v * yRate * netR) / 12;
      var done = s.v >= need;
      if (done && !hit) hit = true;
      var ratio = need > 0 ? (s.v / need) * 100 : 0;
      yrows += '<tr' + (done && s.v - monthly * 12 <= need ? ' class="is-best"' : '') + '>' +
        '<td>' + s.y + '년</td>' +
        '<td><strong>' + fmt(s.v) + ' 원</strong></td>' +
        '<td>' + fmt(mNet) + ' 원</td>' +
        '<td>' + (done ? '달성' : pct(ratio, 0)) + '</td></tr>';
    });
    setHTML('outDivYearRows', yrows);
  }

  /* ========================================================================
     3. 복리 · 적립식
     ====================================================================== */
  function computeCompound() {
    var init = money('inCmpInit');
    var monthly = money('inCmpMonthly');
    var rate = decv('inCmpRate') / 100;
    var years = clamp(Math.floor(decv('inCmpYears')), 0, 60);
    var n = years * 12;
    var rm = Math.pow(1 + rate, 1 / 12) - 1;

    var fvInit = init * Math.pow(1 + rm, n);
    var contFactor = Math.abs(rm) > 1e-12 ? (Math.pow(1 + rm, n) - 1) / rm : n;
    var fvCont = monthly * contFactor;
    var final = fvInit + fvCont;
    var principal = init + monthly * n;
    var profit = final - principal;
    var ret = principal > 0 ? (profit / principal) * 100 : 0;

    // 단리 비교: 초기금은 전 기간, 적립금은 납입 후 남은 기간만큼 단리 이자
    var simpleProfit = init * rate * years + (monthly * rate * (n * (n - 1) / 2)) / 12;
    var simpleTotal = principal + simpleProfit;
    var extra = final - simpleTotal;

    setText('outCmpFinal', won(final));
    setText('outCmpRead', readWon(final));
    setText('outCmpPrincipal', won(principal));
    setText('outCmpProfit', won(profit));
    setText('outCmpReturn', pct(ret, 1));
    setText('outCmpExtra', won(extra));
    setText('outCmpProfitRatio', principal > 0 ? pct((profit / principal) * 100, 0) : '-');

    var pShare = final > 0 ? (principal / final) * 100 : 0;
    var gShare = final > 0 ? (profit / final) * 100 : 0;
    var sp = safe('outCmpStackP'), sg = safe('outCmpStackG');
    if (sp) sp.style.width = clamp(pShare, 0, 100) + '%';
    if (sg) sg.style.width = clamp(gShare, 0, 100) + '%';
    setText('outCmpLegendP', '원금 ' + won(principal) + ' (' + pct(pShare, 0) + ')');
    setText('outCmpLegendG', '수익 ' + won(profit) + ' (' + pct(gShare, 0) + ')');

    var double = rate > 0 ? Math.log(2) / Math.log(1 + rate) : null;
    setText('outCmpDouble', double === null ? '-' : double.toFixed(1) + '년');

    var step = years > 20 ? 2 : 1;
    var rows = '';
    for (var yr = step; yr <= years; yr += step) {
      var m = yr * 12;
      var cf = Math.abs(rm) > 1e-12 ? (Math.pow(1 + rm, m) - 1) / rm : m;
      var v = init * Math.pow(1 + rm, m) + monthly * cf;
      var pr = init + monthly * m;
      rows += '<tr' + (yr === years ? ' class="is-best"' : '') + '>' +
        '<td>' + yr + '년</td><td>' + fmt(pr) + ' 원</td>' +
        '<td><strong>' + fmt(v) + ' 원</strong></td>' +
        '<td>' + fmt(v - pr) + ' 원</td></tr>';
    }
    if (years % step !== 0 && years > 0) {
      rows += '<tr class="is-best"><td>' + years + '년</td><td>' + fmt(principal) + ' 원</td>' +
        '<td><strong>' + fmt(final) + ' 원</strong></td><td>' + fmt(profit) + ' 원</td></tr>';
    }
    setHTML('outCmpRows', rows || '<tr><td colspan="4">투자 기간을 1년 이상 입력하세요.</td></tr>');
  }

  /* ========================================================================
     4. 매도가 · 손절가
     ====================================================================== */
  var MARKET = {
    kospi: { tax: 0.002, label: '코스피 0.20% (거래세 0.05% + 농특세 0.15%)' },
    kosdaq: { tax: 0.002, label: '코스닥 0.20%' },
    konex: { tax: 0.001, label: '코넥스 0.10%' },
    unlisted: { tax: 0.0035, label: '비상장·장외 0.35%' }
  };

  function computeYieldCalc() {
    var bp = money('inBp');
    var q = Math.floor(money('inBq'));
    var sp = money('inSp');
    var fee = Math.max(0, decv('inFee')) / 100;
    var mktEl = safe('inMarket');
    var mk = MARKET[mktEl ? mktEl.value : 'kospi'] || MARKET.kospi;
    var taxRate = mk.tax;

    var buyAmt = bp * q;
    var buyFee = buyAmt * fee;
    var invested = buyAmt + buyFee;
    var sellAmt = sp * q;
    var sellFee = sellAmt * fee;
    var tax = sellAmt * taxRate;
    var netSell = sellAmt - sellFee - tax;
    var profit = netSell - invested;
    var ret = invested > 0 ? (profit / invested) * 100 : 0;

    setText('outYProfit', won(profit));
    setText('outYRead', invested > 0 ? readWon(profit) : '매수가와 수량을 입력하세요');
    setText('outYReturn', pct(ret, 2));
    setText('outYNet', won(netSell));
    setText('outYBuy', won(invested));
    setText('outYFeeSum', won(buyFee + sellFee));
    setText('outYTax', won(tax));
    setText('outYTaxNote', mk.label);

    var box = safe('outYResultBox');
    if (box) {
      box.classList.toggle('negative', profit < 0);
      box.classList.toggle('positive', profit >= 0);
    }

    var factor = q * (1 - fee - taxRate);
    var breakEven = factor > 0 ? invested / factor : 0;
    setText('outYBreak', fmt(Math.ceil(breakEven)) + ' 원');

    var targetR = decv('inTargetR') / 100;
    var stopR = Math.abs(decv('inStopR')) / 100;
    var targetPrice = factor > 0 ? (invested * (1 + targetR)) / factor : 0;
    var stopPrice = factor > 0 ? (invested * (1 - stopR)) / factor : 0;
    setText('outYTargetPrice', fmt(Math.ceil(targetPrice)) + ' 원');
    setText('outYStopPrice', fmt(Math.ceil(stopPrice)) + ' 원');
    setText('outYTargetProfit', won(invested * targetR));
    setText('outYStopLoss', won(-invested * stopR));

    var v = safe('outYVerdict');
    if (v) {
      var cls = profit >= 0 ? 'badge good' : 'badge bad';
      var msg = profit >= 0
        ? '실현 수익 ' + readWon(profit) + ' · 실수익률 ' + pct(ret, 2)
        : '실현 손실 ' + readWon(profit) + ' · 실수익률 ' + pct(ret, 2);
      v.className = 'verdict';
      v.innerHTML = '<span class="' + cls + '"><span class="dot"></span>' + msg + '</span>';
    }

    var tRows = '';
    [0.03, 0.05, 0.1, 0.15, 0.2, 0.3].forEach(function (r) {
      var price = factor > 0 ? (invested * (1 + r)) / factor : 0;
      tRows += '<tr' + (Math.abs(r - targetR) < 0.0001 ? ' class="is-cur"' : '') + '>' +
        '<td>+' + pctFixed(r * 100, 0) + '</td>' +
        '<td><strong>' + fmt(Math.ceil(price)) + ' 원</strong></td>' +
        '<td>' + fmt(invested * r) + ' 원</td></tr>';
    });
    setHTML('outYTargetRows', tRows);

    var sRows = '';
    [0.03, 0.05, 0.08, 0.1, 0.15, 0.2].forEach(function (r) {
      var price = factor > 0 ? (invested * (1 - r)) / factor : 0;
      sRows += '<tr' + (Math.abs(r - stopR) < 0.0001 ? ' class="is-cur"' : '') + '>' +
        '<td>-' + pctFixed(r * 100, 0) + '</td>' +
        '<td><strong>' + fmt(Math.ceil(price)) + ' 원</strong></td>' +
        '<td>' + fmt(-invested * r) + ' 원</td></tr>';
    });
    setHTML('outYStopRows', sRows);
  }

  /* ========================================================================
     5. ISA · 연금저축
     ====================================================================== */
  function computeIsa() {
    var salary = money('inSalary');
    var pSave = money('inPenSave');
    var irp = money('inIrp');
    var creditRate = salary <= 55000000 ? 0.165 : 0.132;

    var penPart = Math.min(pSave, 6000000);
    var irpPart = Math.min(irp, 9000000);
    var eligible = Math.min(penPart + irpPart, 9000000);
    var credit = eligible * creditRate;

    var isaP = money('inIsaPrincipal');
    var isaR = Math.max(0, decv('inIsaRate')) / 100;
    var isaY = clamp(Math.floor(decv('inIsaYears')), 1, 40);
    var isaVal = isaP * Math.pow(1 + isaR, isaY);
    var isaProfit = isaVal - isaP;

    var isSeomin = segState.isaType === 'seomin';
    var exempt = isSeomin ? 4000000 : 2000000;
    var generalTax = isaProfit * 0.154;
    var isaTax = Math.max(0, isaProfit - exempt) * 0.099;
    var isaSave = generalTax - isaTax;
    var total = credit + isaSave;

    setText('outIsaTotal', won(total));
    setText('outIsaCredit', won(credit));
    setText('outIsaEligible', won(eligible));
    setText('outIsaSave', won(isaSave));
    setText('outIsaProfit', won(isaProfit));
    setText('outIsaGenTax', won(generalTax));
    setText('outIsaTax', won(isaTax));
    setText('outIsaValue', won(isaVal));
    setText('outIsaRateTxt', creditRate === 0.165 ? '16.5% (총급여 5,500만 원 이하)' : '13.2% (총급여 5,500만 원 초과)');
    setText('outIsaTypeRate', creditRate === 0.165 ? '16.5%' : '13.2%');
    setText('outIsaTypeTxt', (isSeomin ? '서민형' : '일반형') + ' · 비과세 ' + fmt(exempt / 10000) + '만 원');
    setText('outIsaTotalMini', won(total));
    setText('outIsaVerdictSub', '연금계좌 세액공제 ' + readWon(credit) + ' + ISA 절세 ' + readWon(isaSave));

    var hint = safe('outIsaHint');
    if (hint) {
      var notes = [];
      if (pSave > 6000000) notes.push('연금저축 단독 세액공제 한도는 600만 원이라 초과분 ' + readWon(pSave - 6000000) + '은 공제되지 않습니다.');
      if (pSave + irp > 9000000) notes.push('연금저축·IRP 합산 세액공제 한도는 900만 원입니다.');
      if (isaP > 100000000) notes.push('ISA 총 납입한도(1억 원)를 넘는 금액은 계산에서 제외해야 합니다.');
      hint.textContent = notes.length ? notes.join(' ') : 'IRP를 함께 넣으면 연금저축 단독 600만 원을 넘는 300만 원까지 공제 대상이 됩니다.';
      hint.className = notes.length ? 'notice warn' : 'notice info';
    }

    var v = safe('outIsaVerdict');
    if (v) {
      v.className = 'verdict';
      v.innerHTML = '<span class="badge good"><span class="dot"></span>세액공제 ' + readWon(credit) + ' + ISA 절세 ' + readWon(isaSave) + '</span>';
    }

    var rows = '';
    [3000000, 6000000, 9000000].forEach(function (amt) {
      var e = Math.min(amt, 9000000);
      rows += '<tr' + (Math.abs(e - eligible) < 1 ? ' class="is-cur"' : '') + '>' +
        '<td>' + fmt(amt / 10000) + '만 원</td>' +
        '<td>' + fmt(e * 0.165) + ' 원</td>' +
        '<td>' + fmt(e * 0.132) + ' 원</td></tr>';
    });
    setHTML('outIsaCreditRows', rows);

    var typeRows = '';
    [['일반형', 2000000], ['서민형·농어민형', 4000000]].forEach(function (t) {
      var tx = Math.max(0, isaProfit - t[1]) * 0.099;
      var sv = generalTax - tx;
      var cur = (t[1] === exempt) ? ' class="is-cur"' : '';
      typeRows += '<tr' + cur + '><td>' + t[0] + '</td><td>' + fmt(t[1] / 10000) + '만 원</td>' +
        '<td>' + fmt(tx) + ' 원</td><td><strong>' + fmt(sv) + ' 원</strong></td></tr>';
    });
    setHTML('outIsaTypeRows', typeRows);
  }

  /* ------------------------------------------------------------------ 배분 */
  var page = document.body.getAttribute('data-page') || '';

  function computeAll() {
    if (page === 'averaging') computeAveraging();
    else if (page === 'dividend') computeDividend();
    else if (page === 'compound') computeCompound();
    else if (page === 'yield') computeYieldCalc();
    else if (page === 'isa') computeIsa();
  }

  /* ------------------------------------------------------------------ init */
  function init() {
    initSegments();
    initSubtabs();
    initChips();

    $$('input.js-money').forEach(function (el) {
      el.addEventListener('input', function () { formatMoneyInput(el); computeAll(); });
      el.addEventListener('blur', function () { formatMoneyInput(el); computeAll(); });
      formatMoneyInput(el);
    });
    $$('input.js-dec').forEach(function (el) {
      el.addEventListener('input', function () { formatDecInput(el); computeAll(); });
    });
    $$('input.js-plain, select').forEach(function (el) {
      el.addEventListener('input', computeAll);
      el.addEventListener('change', computeAll);
    });

    computeAll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

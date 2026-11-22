/* ==========================================================================
   부동산·세금·생활비 계산기 — app.js
   모든 계산은 브라우저 안에서만 이뤄집니다. (서버 전송 없음)
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ utils */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function safe(id) { return document.getElementById(id); }
  function val(id) { var el = safe(id); return el ? el.value : ''; }
  function setText(id, text) { var el = safe(id); if (el) el.textContent = text; }
  function setHTML(id, html) { var el = safe(id); if (el) el.innerHTML = html; }

  function money(v) {
    var t = String(v == null ? '' : v).replace(/[^0-9]/g, '');
    if (!t) return 0;
    return Math.min(Number(t), 1e13);
  }
  function dec(v) {
    var t = String(v == null ? '' : v).replace(/,/g, '').replace(/[^0-9.\-]/g, '');
    var n = parseFloat(t);
    return isFinite(n) ? n : 0;
  }
  function fmt(n) {
    var x = Math.round(Number(n) || 0);
    if (x === 0) return '0';
    return x.toLocaleString('ko-KR');
  }
  function won(n) { return fmt(n) + ' 원'; }
  function pct(n, digits) {
    var d = typeof digits === 'number' ? digits : 2;
    var s = (Number(n) || 0).toFixed(d);
    if (s.indexOf('.') !== -1) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s + '%';
  }
  /* 금액을 한글 읽기로: 12,345,678 → 1,234만 원 */
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
  function pctFixed(n, digits) {
    var d = typeof digits === 'number' ? digits : 2;
    return (Number(n) || 0).toFixed(d) + '%';
  }
  function rateLabel(v) {
    var n = Math.round((Number(v) || 0) * 10000) / 10000;
    return n + '%';
  }
  function floorTo(x, unit) {
    var u = unit || 1;
    return Math.floor((Number(x) || 0) / u) * u;
  }
  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }

  /* --------------------------------------------------------- 세그먼트 상태 */
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
        onChangeLabels(key);
        computeAll();
      });
    });
  }

  function onChangeLabels(key) {
    if (key === 'brokerDeal') {
      var isSale = segState.brokerDeal === 'sale';
      setText('lblBrokerPrice', isSale ? '매매가' : '보증금');
      var mf = safe('fieldBrokerMonthly');
      if (mf) mf.style.display = isSale ? 'none' : '';
      setText('lblBrokerResult', isSale ? '상한 중개보수' : '상한 중개보수');
    }
    if (key === 'vatMode') {
      setText('lblVatAmount', segState.vatMode === 'total' ? '합계금액 (부가세 포함)' : '공급가액 (부가세 제외)');
    }
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
        syncChips();
        computeAll();
      });
    });
  }
  function syncChips() {
    $$('[data-chips]').forEach(function (box) {
      var target = safe(box.getAttribute('data-chips'));
      if (!target) return;
      var v = String(target.value).replace(/[^0-9.]/g, '');
      $$('.chip', box).forEach(function (c) {
        c.setAttribute('aria-pressed', c.getAttribute('data-value') === v ? 'true' : 'false');
      });
    });
  }

  /* ------------------------------------------------------------ 금액 포맷팅 */
  function formatMoneyInput(el) {
    var raw = el.value.replace(/[^0-9]/g, '');
    if (raw === '') { el.value = ''; return; }
    raw = raw.replace(/^0+(?=\d)/, '');
    if (raw.length > 14) raw = raw.slice(0, 14);
    el.value = Number(raw).toLocaleString('ko-KR');
  }

  /* --------------------------------------------------------------- 탭 전환 */
  function initSubtabs() {
    $$('.subtabs').forEach(function (group) {
      group.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-sub]');
        if (!btn) return;
        var name = btn.getAttribute('data-sub');
        $$('button', group).forEach(function (b) {
          b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
        });
        var panel = btn.closest('.card');
        $$('.subpanel', panel).forEach(function (sp) {
          sp.classList.toggle('is-active', sp.id === 'sub-' + name);
        });
        computeAll();
      });
    });
  }

  /* ======================================================================
     01. 연말정산 환급액 미리보기
     ====================================================================== */
  var PENSION_MAX_GROSS = 79080000;   /* 국민연금 기준소득월액 상한 659만 원 × 12 */

  function earnedDeduction(g) {
    if (g <= 5000000) return g * 0.7;
    if (g <= 15000000) return 3500000 + (g - 5000000) * 0.4;
    if (g <= 45000000) return 7500000 + (g - 15000000) * 0.15;
    if (g <= 100000000) return 12000000 + (g - 45000000) * 0.05;
    return Math.min(20000000, 14750000 + (g - 100000000) * 0.02);
  }

  var TAX_BRACKETS = [
    [14000000, 0.06, 0],
    [50000000, 0.15, 1260000],
    [88000000, 0.24, 5760000],
    [150000000, 0.35, 15440000],
    [300000000, 0.38, 19940000],
    [500000000, 0.40, 25940000],
    [1000000000, 0.42, 35940000],
    [Infinity, 0.45, 65940000]
  ];

  function basicTax(base) {
    if (base <= 0) return 0;
    for (var k = 0; k < TAX_BRACKETS.length; k++) {
      var b = TAX_BRACKETS[k];
      if (base <= b[0]) return Math.max(0, base * b[1] - b[2]);
    }
    return 0;
  }

  function insuranceEstimate(g) {
    if (g <= 0) return 0;
    var pension = Math.min(g, PENSION_MAX_GROSS) * 0.0475;
    var health = g * 0.03595;
    var ltc = health * 0.1314;
    var emp = g * 0.009;
    return floorTo(pension + health + ltc + emp, 10);
  }

  function laborCreditRaw(calcTax) {
    if (calcTax <= 0) return 0;
    return calcTax <= 1300000
      ? calcTax * 0.55
      : 715000 + (calcTax - 1300000) * 0.3;
  }

  function laborCreditLimit(g) {
    if (g <= 33000000) return 740000;
    if (g <= 70000000) return Math.max(660000, 740000 - (g - 33000000) * 0.008);
    if (g <= 120000000) return Math.max(500000, 660000 - (g - 70000000) * 0.5);
    return Math.max(200000, 500000 - (g - 120000000) * 0.5);
  }

  function cardLimit(g, child) {
    var base, extra;
    if (g <= 70000000) { base = 3000000; extra = 3000000; }
    else { base = 2500000; extra = 2000000; }
    if (child === 1) base += 500000;
    if (child >= 2) base += (g <= 70000000 ? 1000000 : 500000);
    return { base: base, extra: extra };
  }

  /* 신용카드 등 소득공제: 최저사용금액을 공제율이 낮은 신용카드부터 채운다 */
  function cardDeduction(g, sin, debit, child) {
    var minUse = g * 0.25;
    var total = sin + debit;
    var limit = cardLimit(g, child);
    var res = {
      minUse: minUse, total: total, raw: 0, amount: 0,
      limit: limit.base, extra: 0, sinPart: 0, debitPart: 0, usedSin: 0, usedDebit: 0
    };
    if (total <= minUse || minUse <= 0) return res;

    var useSin = Math.min(sin, minUse);
    var remain = minUse - useSin;
    var useDebit = Math.min(debit, remain);
    res.usedSin = useSin;
    res.usedDebit = useDebit;
    res.sinPart = Math.max(0, sin - useSin) * 0.15;
    res.debitPart = Math.max(0, debit - useDebit) * 0.30;
    res.raw = res.sinPart + res.debitPart;
    res.amount = Math.min(res.raw, limit.base);
    return res;
  }

  function yearendModel(o) {
    var gross = o.gross;
    var wded = earnedDeduction(gross);
    var income = gross - wded;
    var basic = 1500000 * (1 + o.family);
    var ins = insuranceEstimate(gross);
    var card = cardDeduction(gross, o.sin, o.debit, o.child);

    var base = Math.max(0, income - basic - ins - card.amount);
    base = floorTo(base, 1000);
    var calcTax = floorTo(basicTax(base), 10);
    var labor = Math.min(laborCreditRaw(calcTax), laborCreditLimit(gross), calcTax);

    var rentCredit = 0;
    var rentEligible = false;
    if (o.rent > 0 && gross <= 80000000) {
      rentEligible = true;
      rentCredit = Math.min(o.rent, 10000000) * (gross <= 55000000 ? 0.17 : 0.15);
    }

    var penCap = 6000000;
    var penPart = Math.min(o.pension, penCap);
    var irpPart = Math.min(o.irp, Math.max(0, 9000000 - penPart));
    var penEligible = penPart + irpPart;
    var penCredit = penEligible * (gross <= 55000000 ? 0.15 : 0.12);

    var donEligible = Math.min(o.donation, income * 0.3);
    var donCredit = donEligible <= 10000000
      ? donEligible * 0.15
      : 10000000 * 0.15 + (donEligible - 10000000) * 0.30;

    var special = rentCredit + penCredit + donCredit;
    var standard = special > 0 ? 0 : 130000;
    var decided = Math.max(0, calcTax - labor - special - standard);

    /* 기납부세액 추정: 회사 간이세액(기본공제·4대보험·표준세액공제만 반영) */
    var estBase = floorTo(Math.max(0, income - basic - ins), 1000);
    var estCalc = floorTo(basicTax(estBase), 10);
    var estLabor = Math.min(laborCreditRaw(estCalc), laborCreditLimit(gross), estCalc);
    var estPaid = Math.max(0, estCalc - estLabor - 130000);

    return {
      gross: gross, wded: wded, income: income, basic: basic, ins: ins, card: card,
      base: base, calcTax: calcTax, labor: labor,
      rentCredit: rentCredit, rentEligible: rentEligible,
      penPart: penPart, irpPart: irpPart, penEligible: penEligible, penCredit: penCredit,
      penRate: gross <= 55000000 ? 15 : 12,
      donEligible: donEligible, donCredit: donCredit,
      special: special, standard: standard, decided: decided,
      estPaid: estPaid,
      deductionTotal: basic + ins + card.amount,
      creditTotal: labor + special + standard
    };
  }

  function calcYearend() {
    if (!safe('outYtRefund')) return;

    var gross = money(val('inYtGross'));
    var family = Number(val('selYtFamily')) || 0;
    var child = Number(val('selYtChild')) || 0;

    if (gross <= 0) {
      setText('outYtRefund', '0 원');
      setText('outYtRefundRead', '총급여를 입력해 주세요');
      ['outYtDecided', 'outYtPaid', 'outYtDeduct', 'outYtCredit'].forEach(function (id) { setText(id, '0 원'); });
      setHTML('outYtRows', '');
      setHTML('outYtCardRows', '');
      var hint0 = safe('outYtNote');
      if (hint0) {
        hint0.className = 'notice info';
        hint0.innerHTML = '총급여를 입력하면 근로소득공제부터 세액공제까지 순서대로 계산해 예상 환급액을 보여 드립니다.';
      }
      return;
    }

    var o = {
      gross: gross,
      family: family,
      child: child,
      sin: money(val('inYtCard')),
      debit: money(val('inYtDebit')),
      rent: money(val('inYtRent')),
      pension: money(val('inYtPension')),
      irp: money(val('inYtIrp')),
      donation: money(val('inYtDonation'))
    };
    var m = yearendModel(o);

    var paidManual = String(val('inYtPaid')).replace(/[^0-9]/g, '') !== '';
    var paid = paidManual ? money(val('inYtPaid')) : m.estPaid;
    var taxRefund = paid - m.decided;                 /* 소득세 차이 */
    var localTax = taxRefund * 0.1;                   /* 지방소득세 */
    var totalRefund = taxRefund + localTax;

    var box = safe('outYtBox');
    var negative = totalRefund < 0;
    if (box) box.classList.toggle('negative', negative);

    setText('outYtLabel', negative ? '예상 추가 납부(추징)' : '예상 환급액');
    setText('outYtRefund', won(Math.abs(totalRefund)));
    setText('outYtRefundRead', negative
      ? '지방소득세 포함 · 2월 급여에서 ' + won(Math.abs(totalRefund)) + '이 빠집니다'
      : '지방소득세 포함 · 2월 급여에 ' + won(Math.abs(totalRefund)) + '이 더해집니다');
    setText('outYtDecided', won(m.decided));
    setText('outYtPaid', won(paid) + (paidManual ? '' : ' (추정)'));
    setText('outYtDeduct', won(m.deductionTotal));
    setText('outYtCredit', won(m.creditTotal));

    /* 단계별 표 */
    var rows = [
      ['총급여액', won(m.gross), '비과세 소득 제외'],
      ['(−) 근로소득공제', won(m.wded), '구간별 공제율 자동 적용'],
      ['= 근로소득금액', won(m.income), ''],
      ['(−) 기본공제', won(m.basic), '본인 150만 원' + (family > 0 ? ' + 부양가족 ' + family + '명' : '')],
      ['(−) 4대보험료 공제(추정)', won(m.ins), '국민연금·건강·장기요양·고용'],
      ['(−) 신용카드 등 소득공제', won(m.card.amount), '최저사용금액 ' + readWon(m.card.minUse) + ' 초과분'],
      ['= 과세표준', won(m.base), '1,000원 미만 절사'],
      ['산출세액', won(m.calcTax), '기본세율 6~45% 누진'],
      ['(−) 근로소득세액공제', won(m.labor), '산출세액의 55% (한도 적용)'],
      ['(−) 월세 세액공제', won(m.rentCredit), m.rentEligible ? (gross <= 55000000 ? '17%' : '15%') + ' · 연 1,000만 원 한도' : '해당 없음'],
      ['(−) 연금계좌 세액공제', won(m.penCredit), (m.penEligible > 0 ? m.penRate + '%' : '납입액 없음')],
      ['(−) 기부금 세액공제', won(m.donCredit), m.donEligible > 0 ? '1,000만 원 초과분 30%' : '해당 없음'],
      ['(−) 표준세액공제', won(m.standard), m.standard > 0 ? '공제 항목이 없을 때 13만 원' : '다른 세액공제 우선'],
      ['= 결정세액', won(m.decided), ''],
      [paidManual ? '(−) 기납부세액(입력)' : '(−) 기납부세액(추정)', won(paid), paidManual ? '' : '회사 원천징수 추정치'],
      ['= 소득세 차액', won(taxRefund), negative ? '추징' : '환급'],
      ['지방소득세(10%)', won(localTax), '소득세 차액의 10%']
    ];
    setHTML('outYtRows', rows.map(function (r, i) {
      var isSum = r[0].indexOf('= 과세표준') === 0 || r[0].indexOf('= 결정세액') === 0 ||
        r[0].indexOf('= 소득세 차액') === 0 || r[0].indexOf('= 근로소득금액') === 0;
      return '<tr' + (isSum ? ' class="is-cur"' : '') + '>' +
        '<td>' + r[0] + '</td>' +
        '<td><strong>' + r[1] + '</strong></td>' +
        '<td style="text-align:left;white-space:normal;font-size:12px;color:#8b95a1">' + r[2] + '</td>' +
        '</tr>';
    }).join(''));

    /* 카드 공제 상세 */
    var cl = m.card;
    var cardRows = [
      ['최저사용금액(총급여 25%)', won(cl.minUse)],
      ['카드 사용액 합계', won(cl.total)],
      ['공제 전 금액(신용 15% · 체크 30%)', won(cl.raw)],
      ['기본 공제한도' + (child > 0 ? '(자녀 ' + child + '명)' : ''), won(cl.limit)],
      ['적용 소득공제액', won(cl.amount)]
    ];
    setHTML('outYtCardRows', cardRows.map(function (r) {
      return '<tr><td>' + r[0] + '</td><td><strong>' + r[1] + '</strong></td></tr>';
    }).join(''));

    /* 안내 문구 */
    var note = safe('outYtNote');
    if (note) {
      var msgs = [];
      if (!paidManual) msgs.push('기납부세액을 비워 두어 <b>회사 원천징수 추정치(' + won(m.estPaid) + ')</b>로 계산했습니다. 원천징수영수증의 기납부세액을 넣으면 더 정확해집니다.');
      if (m.card.total > 0 && m.card.total <= m.card.minUse) msgs.push('카드 사용액이 최저사용금액(총급여의 25%)에 미치지 못해 카드 소득공제가 <b>0원</b>입니다.');
      if (o.rent > 0 && gross > 80000000) msgs.push('총급여 8,000만 원을 넘어 월세 세액공제 대상이 아닙니다(종합소득금액 7,000만 원 이하 요건도 함께 확인).');
      if (o.pension + o.irp > 9000000) msgs.push('연금계좌 납입액 중 <b>900만 원</b>까지만 세액공제됩니다(연금저축 단독은 600만 원).');
      if (o.donation > 0 && o.donation > m.donEligible) msgs.push('기부금은 근로소득금액의 30%까지만 공제 대상입니다.');
      if (!msgs.length) msgs.push('입력한 조건 그대로 계산했습니다. 카드·월세·연금저축 항목을 바꾸면 환급액이 바로 달라집니다.');
      note.className = 'notice ' + (negative ? 'warn' : 'info');
      note.innerHTML = msgs.join(' ');
    }
  }

  /* ======================================================================
     02. 부동산 중개보수(복비)
     ====================================================================== */
  var BROKER = {
    houseSale: [
      { min: 0, max: 50000000, rate: 0.006, cap: 250000, label: '5천만 원 미만' },
      { min: 50000000, max: 200000000, rate: 0.005, cap: 800000, label: '5천만 ~ 2억 원' },
      { min: 200000000, max: 900000000, rate: 0.004, cap: 0, label: '2억 ~ 9억 원' },
      { min: 900000000, max: 1200000000, rate: 0.005, cap: 0, label: '9억 ~ 12억 원' },
      { min: 1200000000, max: 1500000000, rate: 0.006, cap: 0, label: '12억 ~ 15억 원' },
      { min: 1500000000, max: Infinity, rate: 0.007, cap: 0, label: '15억 원 이상' }
    ],
    houseLease: [
      { min: 0, max: 50000000, rate: 0.005, cap: 200000, label: '5천만 원 미만' },
      { min: 50000000, max: 100000000, rate: 0.004, cap: 300000, label: '5천만 ~ 1억 원' },
      { min: 100000000, max: 600000000, rate: 0.003, cap: 0, label: '1억 ~ 6억 원' },
      { min: 600000000, max: 1200000000, rate: 0.004, cap: 0, label: '6억 ~ 12억 원' },
      { min: 1200000000, max: 1500000000, rate: 0.005, cap: 0, label: '12억 ~ 15억 원' },
      { min: 1500000000, max: Infinity, rate: 0.006, cap: 0, label: '15억 원 이상' }
    ],
    officetelSale: [{ min: 0, max: Infinity, rate: 0.005, cap: 0, label: '전용 85㎡ 이하 주거용' }],
    officetelLease: [{ min: 0, max: Infinity, rate: 0.004, cap: 0, label: '전용 85㎡ 이하 주거용' }],
    otherSale: [{ min: 0, max: Infinity, rate: 0.009, cap: 0, label: '상가·토지·건물 (협의)' }],
    otherLease: [{ min: 0, max: Infinity, rate: 0.008, cap: 0, label: '상가·토지·건물 (협의)' }]
  };

  function brokerTable(type, deal) {
    var key = type === 'officetel'
      ? (deal === 'sale' ? 'officetelSale' : 'officetelLease')
      : (type === 'other'
        ? (deal === 'sale' ? 'otherSale' : 'otherLease')
        : (deal === 'sale' ? 'houseSale' : 'houseLease'));
    return BROKER[key];
  }

  function calcBrokerage() {
    if (!safe('outBroFee')) return;

    var deal = segState.brokerDeal || 'sale';
    var type = segState.brokerType || 'house';
    var price = money(val('inBrokerPrice'));
    var monthly = deal === 'lease' ? money(val('inBrokerMonthly')) : 0;

    /* 거래금액: 임대차는 보증금 + 월세×100, 그 합이 5천만 원 미만이면 월세×70 */
    var amount = price;
    var xRule = '';
    if (deal === 'lease' && monthly > 0) {
      var sum100 = price + monthly * 100;
      if (sum100 < 50000000) {
        amount = price + monthly * 70;
        xRule = '보증금 + 월세 × 70 (환산보증금 5천만 원 미만)';
      } else {
        amount = sum100;
        xRule = '보증금 + 월세 × 100';
      }
    } else if (deal === 'lease') {
      amount = price;
      xRule = '전세 — 보증금 전액';
    } else {
      amount = price;
      xRule = '매매가 전액';
    }

    var table = brokerTable(type, deal);
    var row = table[0];
    for (var i = 0; i < table.length; i++) {
      if (amount >= table[i].min && amount < table[i].max) { row = table[i]; break; }
      row = table[i];
    }
    /* 마지막 구간 상한 없음 처리 */
    if (amount >= table[table.length - 1].min) row = table[table.length - 1];

    var capRate = row.rate;
    var capFee = amount * capRate;
    if (row.cap > 0) capFee = Math.min(capFee, row.cap);

    var rateInput = dec(val('inBrokerRate'));
    var useRate = rateInput > 0 ? rateInput / 100 : capRate;
    var fee = amount * useRate;
    if (row.cap > 0 && useRate <= capRate) fee = Math.min(fee, row.cap);

    var vatOn = (segState.brokerVat || 'yes') === 'yes';
    var vat = vatOn ? fee * 0.1 : 0;

    setText('outBroAmount', won(amount));
    setText('outBroAmountRead', xRule + ' · ' + readWon(amount));
    setText('outBroCapRate', pct(capRate * 100, 3));
    setText('outBroCapFee', won(capFee));
    setText('outBroRateUsed', pct(useRate * 100, 3));
    setText('outBroFee', won(fee));
    setText('outBroFeeRead', Math.round(fee).toLocaleString('ko-KR') + '원 (부가세 ' + (vatOn ? '별도' : '없음') + ')');
    setText('outBroVat', won(vat));
    setText('outBroTotal', won(fee + vat));
    setText('outBroLimit', row.cap > 0 ? won(row.cap) : '한도 없음');

    var verdict = safe('outBroVerdict');
    if (verdict) {
      if (useRate > capRate + 0.00001) {
        verdict.innerHTML = '<span class="badge bad"><span class="dot"></span>법정 상한 초과 · ' +
          pct(useRate * 100, 3) + ' &gt; ' + pct(capRate * 100, 3) + '</span>' +
          '<span class="badge warn"><span class="dot"></span>초과분 ' + won(fee - capFee) + '은 청구할 수 없습니다</span>';
      } else {
        var diff = capFee - fee;
        verdict.innerHTML = '<span class="badge good"><span class="dot"></span>법정 상한 이내</span>' +
          (diff >= 1
            ? '<span class="badge"><span class="dot"></span>상한까지 ' + won(diff) + ' 여유</span>'
            : '<span class="badge"><span class="dot"></span>상한요율 그대로 적용</span>');
      }
    }

    /* 요율표 */
    var rows = table.map(function (r) {
      var isCur = r === row;
      return '<tr' + (isCur ? ' class="is-cur"' : '') + '>' +
        '<td>' + r.label + '</td>' +
        '<td>' + pct(r.rate * 100, 3) + '</td>' +
        '<td>' + (r.cap > 0 ? fmt(r.cap) + '원' : '-') + '</td>' +
        '<td><strong>' + (r === row ? won(capFee) : '-') + '</strong></td>' +
        '</tr>';
    }).join('');
    setHTML('outBroRows', rows);

    var note = safe('outBroNote');
    if (note) {
      var base = type === 'house'
        ? '주택 중개보수 상한요율은 공인중개사법 시행규칙 별표 1과 시·도 조례로 정해집니다. 실제 보수는 상한 안에서 중개의뢰인과 개업공인중개사가 협의해 정하며, 한도액을 넘을 수 없습니다.'
        : (type === 'officetel'
          ? '전용면적 85㎡ 이하이면서 주거시설(부엌·욕실 등)을 갖춘 오피스텔은 시행규칙 별표 2의 요율(매매 0.5%, 임대차 0.4% 이내)이 적용됩니다.'
          : '상가·토지 등 주택 외 중개대상물은 매매 0.9%, 임대차 0.8% 이내에서 협의로 정합니다(한도액 없음).');
      var vatNote = vatOn
        ? ' 개업공인중개사가 일반과세자라면 중개보수에 부가가치세 10%가 별도로 붙습니다.'
        : ' 부가세를 포함해 계산했습니다(간이과세자·면세 사업자이거나 총액 합의).';
      note.className = 'notice info';
      note.innerHTML = base + vatNote + ' 중개보수는 원칙적으로 <b>임대인·임차인(매도인·매수인)이 각각</b> 부담하므로, 양쪽을 합치면 위 금액의 2배가 됩니다.';
    }
  }

  /* ======================================================================
     03. 주택 취득세
     ====================================================================== */
  function ordinaryRate(p) {
    if (p <= 600000000) return 1;
    if (p <= 900000000) return Math.round(((p / 100000000) * 2 / 3 - 3) * 10000) / 10000;
    return 3;
  }

  function calcAcqTax() {
    if (!safe('outAcqTotal')) return;

    var price = money(val('inAcqPrice'));
    var count = Number(segState.acqCount || '1');
    var region = (segState.acqRegion || 'no') === 'yes';
    var big = (segState.acqArea || 'small') === 'big';
    var temp = (segState.acqTemp || 'no') === 'yes';
    var first = (segState.acqFirst || 'no') === 'yes';

    var rate, kind;
    var ord = ordinaryRate(price);
    if (count <= 1) { rate = ord; kind = 'ordinary'; }
    else if (count === 2) {
      if (region && !temp) { rate = 8; kind = 'heavy'; }
      else { rate = ord; kind = 'ordinary'; }
    } else if (count === 3) {
      if (region) { rate = 12; kind = 'heavy'; }
      else { rate = 8; kind = 'heavy'; }
    } else { rate = 12; kind = 'heavy'; }

    var eduRate = kind === 'heavy' ? 0.4 : rate * 0.1;
    var agriRate = 0;
    if (big) {
      if (kind === 'ordinary') agriRate = 0.2;
      else agriRate = rate >= 12 ? 1.0 : 0.6;
    }

    var acq = floorTo(price * rate / 100, 10);
    var edu = floorTo(price * eduRate / 100, 10);
    var agri = floorTo(price * agriRate / 100, 10);

    var relief = 0;
    if (first && price <= 1200000000) relief = Math.min(2000000, acq);
    var acqFinal = Math.max(0, acq - relief);
    var total = acqFinal + edu + agri;

    setText('outAcqRate', rateLabel(rate) + (kind === 'heavy' ? ' (중과)' : ''));
    setText('outAcqTotal', won(total));
    setText('outAcqTotalRead', '취득가액의 ' + pctFixed(price > 0 ? (total / price) * 100 : 0, 2));
    setText('outAcqTax', won(acqFinal));
    setText('outAcqEdu', won(edu));
    setText('outAcqAgri', won(agri));
    setText('outAcqRelief', won(relief));

    var rows = [
      ['취득세', pct(rate, 4), won(acqFinal), kind === 'heavy' ? '중과세율 ' + pct(rate, 0) : '유상거래 일반세율 ' + pct(rate, 4)]
    ];
    if (relief > 0) rows.push(['(−) 생애최초 감면', '-', '-' + won(relief), '12억 원 이하·최대 200만 원']);
    rows.push(['지방교육세', pct(eduRate, 4), won(edu), kind === 'heavy' ? '중과 0.4% 고정' : '취득세율의 10%']);
    rows.push(['농어촌특별세', big ? pct(agriRate, 3) : '비과세', won(agri), big ? '전용 85㎡ 초과' : '국민주택 규모 이하']);
    rows.push(['합계', '-', won(total), '']);

    setHTML('outAcqRows', rows.map(function (r, i) {
      var isLast = i === rows.length - 1;
      return '<tr' + (isLast ? ' class="is-cur"' : '') + '>' +
        '<td>' + r[0] + '</td><td>' + r[1] + '</td>' +
        '<td><strong>' + r[2] + '</strong></td>' +
        '<td style="text-align:left;white-space:normal;font-size:12px;color:#8b95a1">' + r[3] + '</td></tr>';
    }).join(''));

    /* 주택 수 × 지역 매트릭스 (기준 세율표) */
    var matrix = [
      ['1주택', '1~3%', '1~3%'],
      ['2주택', '8%', '1~3%'],
      ['3주택', '12%', '8%'],
      ['4주택 이상', '12%', '12%']
    ];
    setHTML('outAcqMatrixRows', matrix.map(function (r, i) {
      var n = i + 1;
      var curLeft = (count === n && region && !(n === 2 && temp));
      var curRight = (count === n && !region);
      return '<tr' + (count === n ? ' class="is-cur"' : '') + '>' +
        '<td>' + r[0] + '</td>' +
        '<td>' + r[1] + (curLeft ? ' <span class="tag">적용</span>' : '') + '</td>' +
        '<td>' + r[2] + (curRight ? ' <span class="tag">적용</span>' : '') + '</td>' +
        '</tr>';
    }).join(''));

    var note = safe('outAcqNote');
    if (note) {
      var msgs = [];
      if (price > 0 && price <= 600000000 && count === 1) msgs.push('6억 원 이하 1주택은 취득세 1%에 지방교육세 0.1%가 붙어 실효 부담은 <b>1.1%</b>입니다.');
      if (kind === 'heavy') msgs.push('다주택 중과는 취득 후 세대 주택 수를 기준으로 판정합니다. 분양권·입주권·주거용 오피스텔도 주택 수에 들어갑니다.');
      if (count === 2 && region && temp) msgs.push('일시적 2주택으로 보아 일반세율을 적용했습니다. 취득일부터 3년(두 주택 모두 조정대상지역이면 2년) 안에 종전 주택을 처분해야 합니다.');
      if (count === 2 && !region) msgs.push('조정대상지역 밖 2주택은 중과 대상이 아니어서 1~3% 일반세율이 적용됩니다.');
      if (big) msgs.push('전용면적 85㎡를 넘으면 농어촌특별세가 붙습니다(국민주택 규모 초과).');
      if (first && price <= 1200000000) msgs.push('생애최초 감면은 취득세에서만 빠지고 지방교육세·농특세는 그대로 부과됩니다. 3개월 내 전입·3년 이상 거주 요건이 있습니다.');
      if (first && price > 1200000000) msgs.push('취득가액이 12억 원을 넘어 생애최초 감면 대상이 아닙니다.');
      msgs.push('지방자치단체는 조례로 취득세율을 표준세율의 50% 범위에서 조정할 수 있어, 실제 고지액은 다를 수 있습니다.');
      note.className = 'notice info';
      note.innerHTML = msgs.join(' ');
    }
  }

  /* ======================================================================
     04. 부가가치세(VAT)
     ====================================================================== */
  function calcVat() {
    if (!safe('outVatTax')) return;

    var mode = segState.vatMode || 'total';
    var amount = money(val('inVatAmount'));
    var ratePct = dec(val('inVatRate'));
    if (ratePct < 0) ratePct = 0;
    if (ratePct > 50) ratePct = 50;
    var r = ratePct / 100;

    var supply, tax, total;
    if (mode === 'total') {
      total = amount;
      supply = r > 0 ? Math.round(amount / (1 + r)) : amount;
      tax = total - supply;
    } else {
      supply = amount;
      tax = Math.round(amount * r);
      total = supply + tax;
    }

    setText('outVatSupply', won(supply));
    setText('outVatTax', won(tax));
    setText('outVatTax2', won(tax));
    setText('outVatTotal', won(total));
    setText('outVatRateUsed', pctFixed(ratePct, 1));
    setText('outVatTaxRate', total > 0 ? pctFixed((tax / total) * 100, 2) : '0%');

    setHTML('outVatRows', [
      ['공급가액', won(supply), mode === 'total' ? '합계금액 ÷ (1 + 세율)' : '입력값'],
      ['부가가치세', won(tax), mode === 'total' ? '합계금액 − 공급가액' : '공급가액 × 세율'],
      ['합계금액', won(total), '']
    ].map(function (r2, i) {
      return '<tr' + (i === 2 ? ' class="is-cur"' : '') + '><td>' + r2[0] + '</td><td><strong>' + r2[1] + '</strong></td><td style="text-align:left;white-space:normal;font-size:12px;color:#8b95a1">' + r2[2] + '</td></tr>';
    }).join(''));

    var note = safe('outVatNote');
    if (note) {
      note.className = 'notice info';
      note.innerHTML = mode === 'total'
        ? '합계금액에서 거꾸로 계산할 때 공급가액은 <b>합계금액 ÷ 1.1</b>을 원 단위로 반올림하고, 부가세는 합계금액과의 차이로 잡습니다. 그래야 두 값을 더했을 때 원래 금액과 정확히 맞습니다.'
        : '공급가액에 세율을 곱해 부가세를 구합니다. 세금계산서의 공급가액·세액 칸에 그대로 적으면 됩니다.';
    }
  }

  /* ======================================================================
     05. 유류비·연비
     ====================================================================== */
  function calcFuel() {
    if (!safe('outFuelCost')) return;

    var dist = dec(val('inFuelDist'));
    var round = (segState.fuelTrip || 'one') === 'round';
    var eff = dec(val('inFuelEff'));
    var price = money(val('inFuelPrice'));
    var days = dec(val('inFuelDays'));

    var km = dist * (round ? 2 : 1);
    var liters = eff > 0 ? km / eff : 0;
    var cost = liters * price;
    var perKm = km > 0 ? cost / km : 0;

    setText('outFuelKm', km > 0 ? fmt(km) + ' km' : '0 km');
    setText('outFuelLiter', liters > 0 ? (Math.round(liters * 100) / 100).toLocaleString('ko-KR') + ' L' : '0 L');
    setText('outFuelCost', won(cost));
    setText('outFuelCostRead', readWon(cost));
    setText('outFuelPerKm', won(perKm));
    setText('outFuelPer100', won(perKm * 100));
    setText('outFuelMonth', days > 0 ? won(cost * days) : '-');
    setText('outFuelYear', days > 0 ? won(cost * days * 12) : '-');

    var note = safe('outFuelNote');
    if (note) {
      note.className = 'notice info';
      note.innerHTML = eff > 0
        ? '연비 ' + eff + 'km/L, 유가 ' + fmt(price) + '원/L 기준입니다. 실제 연비는 공인연비의 70~85% 수준인 경우가 많아, 겨울철·시내 주행이 많다면 공인연비에서 <b>15% 정도 낮춰</b> 입력해 보세요.'
        : '연비를 입력하면 필요한 연료량과 유류비가 계산됩니다.';
    }

    /* 연비 민감도 */
    if (eff > 0 && price > 0) {
      var list = [-2, -1, 0, 1, 2];
      setHTML('outFuelRows', list.map(function (d) {
        var e = eff + d;
        if (e <= 0) return '';
        var c = (km / e) * price;
        var isCur = d === 0;
        return '<tr' + (isCur ? ' class="is-cur"' : '') + '>' +
          '<td>' + e + ' km/L' + (isCur ? ' <span class="tag">입력값</span>' : '') + '</td>' +
          '<td>' + (Math.round((km / e) * 100) / 100).toLocaleString('ko-KR') + ' L</td>' +
          '<td><strong>' + won(c) + '</strong></td>' +
          '<td>' + won(km > 0 ? c / km : 0) + '</td>' +
          '</tr>';
      }).join(''));
    } else {
      setHTML('outFuelRows', '');
    }
  }

  /* ================================================================ 라벨 동기 */
  var READ_PAIRS = [
    ['inYtGross', 'readYtGross'],
    ['inYtCard', 'readYtCard'],
    ['inYtDebit', 'readYtDebit'],
    ['inYtRent', 'readYtRent'],
    ['inYtPension', 'readYtPension'],
    ['inYtIrp', 'readYtIrp'],
    ['inYtDonation', 'readYtDonation'],
    ['inYtPaid', 'readYtPaid'],
    ['inBrokerPrice', 'readBrokerPrice'],
    ['inBrokerMonthly', 'readBrokerMonthly'],
    ['inAcqPrice', 'readAcqPrice'],
    ['inVatAmount', 'readVatAmount'],
    ['inFuelPrice', 'readFuelPrice']
  ];

  function syncReads() {
    READ_PAIRS.forEach(function (pair) {
      var input = safe(pair[0]);
      var out = safe(pair[1]);
      if (!input || !out) return;
      var raw = String(input.value).replace(/[^0-9]/g, '');
      var num = money(input.value);
      out.textContent = raw && num > 0 ? readWon(num) : '';
    });
  }

  /* ================================================================== 실행 */
  function computeAll() {
    syncReads();
    try { calcYearend(); } catch (e) { console.error('yearend', e); }
    try { calcBrokerage(); } catch (e) { console.error('brokerage', e); }
    try { calcAcqTax(); } catch (e) { console.error('acq', e); }
    try { calcVat(); } catch (e) { console.error('vat', e); }
    try { calcFuel(); } catch (e) { console.error('fuel', e); }
    syncChips();
  }

  function initEvents() {
    document.addEventListener('input', function (e) {
      var t = e.target;
      if (!t) return;
      if (t.classList && t.classList.contains('js-money')) formatMoneyInput(t);
      computeAll();
    });
    document.addEventListener('change', function (e) {
      if (e.target && (e.target.tagName === 'SELECT' || e.target.type === 'date')) computeAll();
    });
  }

  function init() {
    initSegments();
    initChips();
    initSubtabs();
    initEvents();
    onChangeLabels('brokerDeal');
    onChangeLabels('vatMode');
    computeAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

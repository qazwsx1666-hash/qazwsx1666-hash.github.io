/* ==========================================================================
   운세·로또 툴 허브 — app.js
   사주(음양력·절기) · 오늘의 운세 · 궁합 · 로또 · 만 나이 D-day
   모든 계산은 브라우저에서만 이뤄지며 서버로 전송되지 않습니다.
   ========================================================================== */
(function () {
  'use strict';

  var D = window.FORTUNE_DATA || { lunar: {}, term: {}, dreams: [] };

  /* ---------------------------------------------------------------- 기본 상수 */
  var STEM = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  var STEM_H = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var BRANCH = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
  var BRANCH_H = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var STEM_EL = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];      // 0목 1화 2토 3금 4수
  var BRANCH_EL = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  var EL = ['목', '화', '토', '금', '수'];
  var EL_HAN = ['木', '火', '土', '金', '水'];
  var EL_COLOR = ['#12b76a', '#f04452', '#c08a1e', '#7b8794', '#2f6fd0'];
  var EL_NAMES = {
    '목': '나무', '화': '불', '토': '흙', '금': '쇠', '수': '물'
  };
  var EL_LUCK = {
    '목': { color: '청록·초록', hex: '#12b76a', dir: '동쪽', nums: '3 · 8', act: '아침 산책, 새 프로젝트 시작' },
    '화': { color: '빨강·주황', hex: '#f04452', dir: '남쪽', nums: '2 · 7', act: '햇볕 쬐기, 좋아하는 일에 몰입' },
    '토': { color: '노랑·베이지', hex: '#c08a1e', dir: '중앙', nums: '5 · 10', act: '규칙적인 식사와 저축 습관' },
    '금': { color: '흰색·은색', hex: '#9aa4ae', dir: '서쪽', nums: '4 · 9', act: '정리정돈, 마감 시간 지키기' },
    '수': { color: '검정·파랑', hex: '#2f6fd0', dir: '북쪽', nums: '1 · 6', act: '물 마시기, 독서와 여행' }
  };
  var ZODIAC = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
  var ZODIAC_EMOJI = ['🐭', '🐮', '🐯', '🐰', '🐲', '🐍', '🐴', '🐑', '🐵', '🐔', '🐶', '🐷'];
  var ZODIAC_H = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  var STARS = [
    { k: '물병자리', e: '♒', s: [1, 20], t: [2, 18] },
    { k: '물고기자리', e: '♓', s: [2, 19], t: [3, 20] },
    { k: '양자리', e: '♈', s: [3, 21], t: [4, 19] },
    { k: '황소자리', e: '♉', s: [4, 20], t: [5, 20] },
    { k: '쌍둥이자리', e: '♊', s: [5, 21], t: [6, 21] },
    { k: '게자리', e: '♋', s: [6, 22], t: [7, 22] },
    { k: '사자자리', e: '♌', s: [7, 23], t: [8, 22] },
    { k: '처녀자리', e: '♍', s: [8, 23], t: [9, 22] },
    { k: '천칭자리', e: '♎', s: [9, 23], t: [10, 22] },
    { k: '전갈자리', e: '♏', s: [10, 23], t: [11, 22] },
    { k: '사수자리', e: '♐', s: [11, 23], t: [12, 21] },
    { k: '염소자리', e: '♑', s: [12, 22], t: [1, 19] }
  ];

  var DAY = 86400000;

  /* ---------------------------------------------------------------- 유틸 */
  function $(id) { return document.getElementById(id); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function nf(n) { return (Math.round(n * 100) / 100).toLocaleString('ko-KR'); }
  function num(n) { return Number(n).toLocaleString('ko-KR'); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function parseISO(s) {
    if (!s) return null;
    var p = String(s).split('-');
    if (p.length !== 3) return null;
    var y = +p[0], m = +p[1], d = +p[2];
    if (!y || !m || !d) return null;
    var dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return dt;
  }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function diffDays(a, b) { /* a → b (일수) */
    var ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    var ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((ub - ua) / DAY);
  }
  var WD = ['일', '월', '화', '수', '목', '금', '토'];
  function dateKo(d) { return d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일 (' + WD[d.getDay()] + ')'; }
  function dateKoShort(d) { return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 (' + WD[d.getDay()] + ')'; }

  function jdn(y, m, d) {
    var a = Math.floor((14 - m) / 12);
    var y2 = y + 4800 - a;
    var m2 = m + 12 * a - 3;
    return d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
  }

  /* ---------------------------------------------------------------- 해시 · 난수 */
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a += 0x6D2B79F5;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(arr, r) { return arr[Math.floor(r * arr.length) % arr.length]; }

  /* ---------------------------------------------------------------- 음력 변환 */
  function lunarMonths(ly) {
    var e = D.lunar[String(ly)];
    if (!e) return null;
    var off = e[0], lens = e[1], leapM = e[2];
    var list = [], i = 0;
    for (var m = 1; m <= 12; m++) {
      list.push({ m: m, leap: false, len: 29 + Number(lens[i++]) });
      if (leapM === m) list.push({ m: m, leap: true, len: 29 + Number(lens[i++]) });
    }
    return { off: off, list: list };
  }

  function lunarToSolar(ly, lm, ld, isLeap) {
    var info = lunarMonths(ly);
    if (!info) return null;
    var skip = 0, found = null;
    for (var i = 0; i < info.list.length; i++) {
      var mo = info.list[i];
      if (mo.m === lm && mo.leap === !!isLeap) { found = mo; break; }
      skip += mo.len;
    }
    if (!found) return null;
    if (ld < 1 || ld > found.len) return null;
    return addDays(new Date(ly, 0, 1), info.off + skip + (ld - 1));
  }

  function solarToLunar(date) {
    var ly = date.getFullYear();
    var jan1 = lunarToSolar(ly, 1, 1, false);
    if (!jan1) return null;
    if (diffDays(jan1, date) < 0) {
      ly -= 1;
      jan1 = lunarToSolar(ly, 1, 1, false);
      if (!jan1) return null;
    }
    var info = lunarMonths(ly);
    if (!info) return null;
    var left = diffDays(jan1, date);
    for (var i = 0; i < info.list.length; i++) {
      var mo = info.list[i];
      if (left < mo.len) return { y: ly, m: mo.m, d: left + 1, leap: mo.leap };
      left -= mo.len;
    }
    return null;
  }

  /* ---------------------------------------------------------------- 사주 계산 */
  function termBoundaries(year) {
    // [{date:Date, branch:0..11}] — 축월(소한)부터 자월(대설)
    var s = D.term[String(year)];
    if (!s) return null;
    var out = [];
    var base = new Date(year, 0, 1);
    for (var i = 0; i < 12; i++) {
      var chunk = s.substr(i * 7, 7);
      if (chunk.length < 7) return null;
      var doy = Number(chunk.substr(0, 3));
      var hh = Number(chunk.substr(3, 2));
      var mi = Number(chunk.substr(5, 2));
      var dt = new Date(base.getFullYear(), base.getMonth(), base.getDate() + (doy - 1), hh, mi, 0);
      out.push({ date: dt, branch: (i + 1) % 12 === 0 ? 0 : i + 1 }); // i0(소한)→1 축 ... i11(대설)→0 자
    }
    return out;
  }

  function sajuFromSolar(date, hour, minute) {
    var y = date.getFullYear();
    var hasHour = (hour !== null && hour !== undefined);
    var dt = new Date(y, date.getMonth(), date.getDate(), hasHour ? hour : 12, hasHour ? (minute || 0) : 0, 0);

    var bounds = termBoundaries(y);
    var prevBounds = termBoundaries(y - 1);
    var ipchun = null;
    if (bounds) {
      for (var i = 0; i < bounds.length; i++) if (bounds[i].branch === 2) ipchun = bounds[i].date;
    }

    // 연주: 입춘 기준
    var ganjiYear = y;
    if (ipchun && dt.getTime() < ipchun.getTime()) ganjiYear = y - 1;
    var yIdx = ((ganjiYear - 4) % 60 + 60) % 60;
    var yStem = yIdx % 10, yBranch = yIdx % 12;

    // 월주: 절입 기준
    var monthBranch = null;
    if (bounds) {
      var all = (prevBounds || []).map(function (b) { return { date: b.date, branch: b.branch }; })
        .concat(bounds);
      var last = null;
      for (var j = 0; j < all.length; j++) {
        if (all[j].date.getTime() <= dt.getTime()) last = all[j];
      }
      if (!last) last = { branch: 1 };
      monthBranch = last.branch;
    } else {
      // 데이터 범위 밖: 근사치 (매월 5일 전후 절입)
      var approx = [6, 4, 6, 5, 6, 6, 7, 8, 8, 8, 7, 7];
      var bOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0];
      var mi2 = date.getMonth();
      monthBranch = bOrder[mi2];
      if (date.getDate() < approx[mi2]) {
        var prevB = (mi2 === 0) ? 0 : bOrder[mi2 - 1];
        monthBranch = prevB;
      }
    }

    var monthOrder = ((monthBranch - 2) + 12) % 12; // 인월=0 … 축월=11
    var firstMonthStem = ((yStem % 5) * 2 + 2) % 10;
    var mStem = (firstMonthStem + monthOrder) % 10;

    // 일주: JDN 기준, 23시 이후는 다음 날로 계산(조자시)
    var dDay = date;
    if (hasHour && hour >= 23) dDay = addDays(date, 1);
    var dIdx = ((jdn(dDay.getFullYear(), dDay.getMonth() + 1, dDay.getDate()) + 49) % 60 + 60) % 60;
    var dStem = dIdx % 10, dBranch = dIdx % 12;

    // 시주
    var hStem = null, hBranch = null;
    if (hasHour) {
      hBranch = Math.floor(((hour + 1) % 24) / 2) % 12;
      hStem = ((dStem % 5) * 2 + hBranch) % 10;
    }

    var letters = [
      { pos: '연주', stem: yStem, branch: yBranch },
      { pos: '월주', stem: mStem, branch: monthBranch },
      { pos: '일주', stem: dStem, branch: dBranch }
    ];
    if (hasHour) letters.push({ pos: '시주', stem: hStem, branch: hBranch });

    var counts = [0, 0, 0, 0, 0];
    letters.forEach(function (p) {
      counts[STEM_EL[p.stem]]++;
      counts[BRANCH_EL[p.branch]]++;
    });

    return {
      date: date,
      hadTime: hasHour,
      letters: letters,
      counts: counts,
      dayStem: dStem,
      dayBranch: dBranch,
      yearStem: yStem,
      yearBranch: yBranch,
      ganjiYear: ganjiYear
    };
  }

  function sajuOf(date, hour, minute) { return sajuFromSolar(date, hour, minute); }

  function gzLine(stem, branch) { return STEM[stem] + BRANCH[branch] + '(' + STEM_H[stem] + BRANCH_H[branch] + ')'; }

  /* ---------------------------------------------------------------- 사주 해설 텍스트 */
  var DAY_MASTER = [
    { t: '갑목(甲木) · 곧게 뻗는 큰 나무', d: '한번 세운 목표를 향해 곧게 나아가는 힘이 있습니다. 원칙과 명예를 중시하고, 앞에서 이끄는 역할을 맡으면 능력을 발휘합니다. 다만 휘어지지 않으려는 성향이 강해 타협이 늦을 수 있습니다.' },
    { t: '을목(乙木) · 유연한 덩굴과 화초', d: '상황에 맞춰 휘어지는 적응력과 섬세한 감각이 강점입니다. 사람들 사이를 부드럽게 잇는 역할에 어울리고, 겉은 온순해 보여도 속은 질기고 끈질깁니다. 결정을 미루다 기회를 놓치지 않도록 주의하세요.' },
    { t: '병화(丙火) · 하늘 높이 뜬 태양', d: '밝고 열정적이며 감정을 숨기지 않습니다. 무리를 끌고 가는 추진력이 있고, 남에게 베푸는 것을 좋아합니다. 기세가 오르면 빠르게 밀어붙이지만, 금방 식는 열정은 꾸준함으로 보완해야 합니다.' },
    { t: '정화(丁火) · 어둠을 밝히는 촛불', d: '따뜻하고 섬세하며 직관이 뛰어납니다. 한 사람, 한 가지 일에 깊게 파고드는 집중력이 강점입니다. 속마음을 잘 드러내지 않아 오해를 살 수 있으니 표현을 조금 더 늘려 보세요.' },
    { t: '무토(戊土) · 묵직한 큰 산', d: '믿음직하고 포용력이 있으며 쉽게 흔들리지 않습니다. 사람을 담아내는 그릇이 커서 조직의 중심을 잡는 역할에 어울립니다. 변화에 대한 저항이 커서 결정이 늦어지는 점은 주의가 필요합니다.' },
    { t: '기토(己土) · 기름진 논밭', d: '현실 감각과 실속이 좋고, 맡은 일을 조용히 해냅니다. 세심하게 챙기는 능력이 뛰어나 주변 사람이 편안함을 느낍니다. 속을 잘 드러내지 않아 손해를 보는 일이 없도록 자기 몫을 분명히 하세요.' },
    { t: '경금(庚金) · 단단한 원석과 칼', d: '결단이 빠르고 의리가 있으며, 불의를 참지 못합니다. 어려운 일을 정면으로 돌파하는 힘이 있어 승부처에서 강합니다. 직설적인 표현이 관계를 상하게 할 수 있으니 말의 온도를 조절하세요.' },
    { t: '신금(辛金) · 세공된 보석과 바늘', d: '예리한 판단과 미적 감각이 뛰어나며 완벽을 추구합니다. 섬세한 작업이나 전문직에서 두각을 나타냅니다. 스스로에게 엄격한 만큼 타인에게도 기준이 높아, 유연함을 더하면 좋습니다.' },
    { t: '임수(壬水) · 큰 강과 바다', d: '생각의 폭이 넓고 유연하며 지혜롭습니다. 여러 사람과 어울리며 큰 그림을 그리는 일에 강점이 있습니다. 가능성을 넓게 보는 대신 마무리가 약해질 수 있으니 마감을 정해 두세요.' },
    { t: '계수(癸水) · 이슬비와 샘물', d: '감수성이 풍부하고 통찰력이 있으며, 남이 놓친 것을 알아챕니다. 조용히 스며들어 영향을 주는 유형입니다. 생각이 많아 실행이 늦어지지 않도록 작은 행동부터 시작하세요.' }
  ];

  var WEALTH_TEXT = {
    '목': '성실하게 키워서 모으는 재물형입니다. 한 번 시작한 일을 오래 끌고 가는 힘이 있어 급한 단타보다 꾸준한 적립과 장기 자산이 유리합니다. 사람을 통해 배우는 투자가 잘 맞습니다.',
    '화': '벌기도 빨리, 쓰기도 빠른 편입니다. 사람을 통해 돈이 오가는 구조라 인맥이 곧 재물이 되지만, 충동지출을 막는 자동이체 장치가 필요합니다. 눈에 보이는 성과가 동기부여가 됩니다.',
    '토': '재물을 담아 두는 그릇이 큰 유형입니다. 부동산·예적금처럼 쌓이는 자산에 강하고, 한곳에 몰아넣기보다 나눠 담을 때 안전합니다. 사람을 챙기는 지출이 결국 재물로 돌아옵니다.',
    '금': '숫자를 정확히 따져 이익을 남기는 재물형입니다. 협상과 계약에서 강하고 손실을 빨리 끊는 결단이 있습니다. 다만 지나친 계산은 인연을 줄일 수 있어 베푸는 지출이 재물의 흐름을 열어 줍니다.',
    '수': '돈의 흐름을 읽는 감각이 뛰어납니다. 유동성이 큰 대신 새는 곳도 많아 통장 분리와 기록이 재물을 지켜 줍니다. 새로운 분야에 일찍 들어가 이익을 보는 편입니다.'
  };
  var JOB_TEXT = {
    '목': '성장과 기획의 영역이 잘 맞습니다. 교육·출판·콘텐츠·의료·기획·스타트업처럼 무언가를 키우는 일에서 성과가 나고, 장기 프로젝트를 맡을수록 강점이 드러납니다.',
    '화': '드러내고 설득하는 일이 잘 맞습니다. 마케팅·영업·방송·요식·디자인·강의처럼 사람 앞에 서는 직무에서 빛나며, 성과가 눈에 보이는 환경에서 동력이 붙습니다.',
    '토': '기반을 다지는 일이 잘 맞습니다. 부동산·건설·농식품·행정·회계·물류처럼 안정과 신뢰가 중요한 분야에서 오래 일할수록 인정받습니다.',
    '금': '정확함이 무기인 분야가 잘 맞습니다. 금융·법률·엔지니어링·제조·보안·품질관리처럼 기준과 절차가 분명한 일에서 강합니다.',
    '수': '흐름을 읽는 일이 잘 맞습니다. 유통·무역·물류·IT·상담·연구처럼 정보와 사람이 오가는 분야에서 유연하게 활약합니다.'
  };
  var STRONG_TEXT = {
    '목': '목의 기운이 강해 추진력과 성장욕이 큽니다. 다만 고집으로 보일 수 있으니 시작한 일을 끝까지 마무리하는 습관이 신뢰를 만듭니다.',
    '화': '화의 기운이 강해 열정과 표현이 넘칩니다. 감정 기복으로 보이지 않도록 말보다 결과로 보여 주는 편이 좋습니다.',
    '토': '토의 기운이 강해 안정과 신뢰가 큽니다. 변화를 미루다 기회를 놓치지 않도록 작은 변화부터 시도하세요.',
    '금': '금의 기운이 강해 원칙과 결단이 확실합니다. 융통성이 부족해 보일 수 있으니 상대의 사정을 한 번 더 들어 보세요.',
    '수': '수의 기운이 강해 생각이 깊고 유연합니다. 생각이 많아 실행이 늦어질 수 있으니 70% 준비되면 시작하세요.'
  };
  var WEAK_TEXT = {
    '목': '목의 기운이 옅어 시작과 기획의 힘이 약할 수 있습니다. 아침 산책, 독서, 작은 새 프로젝트 하나가 목의 기운을 채워 줍니다.',
    '화': '화의 기운이 옅어 열정과 표현이 아쉬울 수 있습니다. 햇볕을 쬐고 좋아하는 일에 시간을 쓰면 화의 기운이 살아납니다.',
    '토': '토의 기운이 옅어 기반과 지속력이 흔들릴 수 있습니다. 규칙적인 식사·운동과 자동저축이 토의 기운을 다져 줍니다.',
    '금': '금의 기운이 옅어 결단과 마무리가 약할 수 있습니다. 정리정돈, 기록, 마감 시간을 정하는 습관이 금의 기운을 키웁니다.',
    '수': '수의 기운이 옅어 유연함과 통찰이 아쉬울 수 있습니다. 물을 자주 마시고 여행·독서로 시야를 넓히면 수의 기운이 보충됩니다.'
  };

  /* ---------------------------------------------------------------- 사주 페이지 */
  function initSaju() {
    var form = $('sajuForm');
    if (!form) return;

    var segCal = form.querySelector('[data-seg="calType"]');
    var inBirth = $('inBirth');
    var chkWrap = $('leapWrap');
    var chkLeap = $('chkLeap');
    var selHour = $('selHour');
    var outPillars = $('outPillars');
    var outSolar = $('outSolar');
    var outLunar = $('outLunar');
    var outBars = $('outElBars');
    var outDayMaster = $('outDayMaster');
    var outWealth = $('outWealth');
    var outJob = $('outJob');
    var outBalance = $('outBalance');
    var outLuck = $('outLuck');
    var outZodiac = $('outZodiac');
    var outNote = $('outSajuNote');

    if (inBirth && !inBirth.value) inBirth.value = '1995-05-15';

    function calType() {
      var b = segCal ? segCal.querySelector('[aria-pressed="true"]') : null;
      return b ? b.getAttribute('data-value') : 'solar';
    }
    function hourVal() {
      if (!selHour || selHour.value === '') return { h: null, m: 0 };
      return { h: Number(selHour.value), m: 0 };
    }

    function render() {
      var d = parseISO(inBirth && inBirth.value);
      if (!d) {
        outPillars.innerHTML = '<p class="inline-note">생년월일을 입력해 주세요.</p>';
        return;
      }
      var solarDate = d, lunarNote = '';
      if (calType() === 'lunar') {
        var conv = lunarToSolar(d.getFullYear(), d.getMonth() + 1, d.getDate(), chkLeap && chkLeap.checked);
        if (!conv) {
          outPillars.innerHTML = '<p class="inline-note">음력 날짜를 확인해 주세요. (음력 1930~2049년 지원)</p>';
          return;
        }
        solarDate = conv;
        lunarNote = '음력 ' + d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일' + (chkLeap && chkLeap.checked ? ' (윤달)' : '') + ' → 양력 ' + dateKo(solarDate);
      }

      var hv = hourVal();
      var s = sajuOf(solarDate, hv.h, hv.m);
      var lunar = solarToLunar(solarDate);

      if (outSolar) outSolar.textContent = '양력 ' + dateKo(solarDate);
      if (outLunar) outLunar.textContent = lunar ? ('음력 ' + lunar.y + '년 ' + (lunar.leap ? '윤' : '') + lunar.m + '월 ' + lunar.d + '일') : '';
      if (outNote) outNote.textContent = lunarNote;

      // 원국
      var html = '<div class="pillars">';
      s.letters.forEach(function (p) {
        var eS = EL[STEM_EL[p.stem]], eB = EL[BRANCH_EL[p.branch]];
        html += '<div class="pillar' + (p.pos === '일주' ? ' is-day' : '') + '">' +
          '<span class="p-label">' + p.pos + '</span>' +
          '<span class="p-char o-' + eS + '">' + STEM[p.stem] + '</span>' +
          '<span class="p-char o-' + eB + '">' + BRANCH[p.branch] + '</span>' +
          '<span class="p-el">' + STEM_H[p.stem] + BRANCH_H[p.branch] + ' · ' + eS + eB + '</span>' +
          '</div>';
      });
      if (!s.hadTime) {
        html += '<div class="pillar" style="display:grid;place-items:center;color:var(--ink-4)">' +
          '<span class="p-label">시주</span><span class="p-char" style="color:var(--ink-4);font-size:18px">모름</span>' +
          '<span class="p-el">시간 입력 시</span></div>';
      }
      html += '</div>';
      outPillars.innerHTML = html;

      // 오행 비율
      var total = s.counts.reduce(function (a, b) { return a + b; }, 0);
      var bars = '<div class="bars el-bars">';
      for (var i = 0; i < 5; i++) {
        var pct = total ? Math.round((s.counts[i] / total) * 100) : 0;
        bars += '<div class="bar-row o-' + EL[i] + '">' +
          '<div class="bar-head"><span class="name"><span class="tag-o">' + EL[i] + ' ' + EL_HAN[i] + '</span></span>' +
          '<span class="val">' + s.counts[i] + '개 · ' + pct + '%</span></div>' +
          '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div></div>';
      }
      bars += '</div>';
      outBars.innerHTML = bars;

      // 일간 해설
      var dm = DAY_MASTER[s.dayStem];
      var dayEl = EL[STEM_EL[s.dayStem]];
      outDayMaster.innerHTML = '<div class="split" style="align-items:flex-start">' +
        '<div><h3 style="font-size:15.5px;font-weight:800">' + dm.t + '</h3>' +
        '<p class="inline-note" style="margin-top:6px">' + dm.d + '</p></div>' +
        '<span class="tag-o o-' + dayEl + '" style="font-size:12px;padding:5px 10px">일간 ' + EL_HAN[STEM_EL[s.dayStem]] + ' · ' + EL_NAMES[dayEl] + '</span></div>';

      outWealth.textContent = WEALTH_TEXT[dayEl];
      outJob.textContent = JOB_TEXT[dayEl];

      // 강약
      var maxI = 0, minI = 0;
      for (var k = 1; k < 5; k++) {
        if (s.counts[k] > s.counts[maxI]) maxI = k;
        if (s.counts[k] < s.counts[minI]) minI = k;
      }
      var big = EL[maxI], small = EL[minI];
      var balance = '<p><b>' + big + '(' + EL_HAN[maxI] + ') ' + s.counts[maxI] + '개</b>로 가장 강하고, <b>' +
        small + '(' + EL_HAN[minI] + ') ' + s.counts[minI] + '개</b>로 가장 약합니다.</p>' +
        '<p style="margin-top:8px">' + STRONG_TEXT[big] + '</p>' +
        '<p style="margin-top:6px">' + WEAK_TEXT[small] + '</p>';
      outBalance.innerHTML = balance;

      var luck = EL_LUCK[small];
      outLuck.innerHTML = '<div class="luck-grid">' +
        '<div class="luck-item"><span>보완 오행</span><strong>' + small + '(' + EL_HAN[minI] + ') · ' + EL_NAMES[small] + '</strong></div>' +
        '<div class="luck-item"><span>추천 색</span><strong><span class="swatch" style="background:' + luck.hex + '"></span>' + luck.color + '</strong></div>' +
        '<div class="luck-item"><span>추천 방향</span><strong>' + luck.dir + '</strong></div>' +
        '<div class="luck-item"><span>보완 행동</span><strong style="font-size:13px;font-weight:700">' + luck.act + '</strong></div>' +
        '</div>';

      if (outZodiac) {
        var zi = (s.ganjiYear - 4) % 12;
        zi = ((zi % 12) + 12) % 12;
        outZodiac.textContent = ZODIAC_EMOJI[zi] + ' ' + ZODIAC[zi] + '띠 (' + ZODIAC_H[zi] + ') · ' + s.ganjiYear + '년생 기준';
      }
    }

    if (segCal) {
      segCal.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-value]');
        if (!b) return;
        $$('button', segCal).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        if (chkWrap) chkWrap.style.display = b.getAttribute('data-value') === 'lunar' ? '' : 'none';
        render();
      });
    }
    [inBirth, chkLeap, selHour].forEach(function (el) {
      if (el) el.addEventListener('change', render);
      if (el && el.tagName === 'INPUT') el.addEventListener('input', render);
    });
    render();
  }

  /* ---------------------------------------------------------------- 오늘의 운세 */
  var HOUR_LUCK = ['오전 7~9시', '오전 9~11시', '오전 11시~오후 1시', '오후 1~3시', '오후 3~5시', '오후 5~7시', '오후 7~9시', '밤 9~11시'];
  var LUCK_COLORS = [
    { n: '코랄 핑크', c: '#ff7a85' }, { n: '딥 네이비', c: '#22315b' }, { n: '올리브 그린', c: '#7a8b3a' },
    { n: '샌드 베이지', c: '#e6d3b3' }, { n: '라벤더', c: '#b9a7f0' }, { n: '버건디', c: '#7b2b3b' },
    { n: '스카이 블루', c: '#7cc4f0' }, { n: '머스터드 옐로', c: '#e0b53c' }, { n: '포레스트 그린', c: '#2f6b4f' },
    { n: '퓨어 화이트', c: '#ffffff' }, { n: '차콜 그레이', c: '#3c4149' }, { n: '테라코타', c: '#c4684a' }
  ];
  var LUCK_ITEMS = ['향수 한 방울', '손수건', '은반지', '만년필', '텀블러', '이어폰', '고급 볼펜', '접이식 우산',
    '스카프', '가죽 지갑', '미니 화분', '립밤', '손목시계', '안경', '카드지갑', '열쇠고리', '머그컵', '노트'];
  var BANDS = [
    { min: 90, label: '최상', pre: '기대 이상으로 풀리는 날입니다.' },
    { min: 80, label: '좋음', pre: '순조롭게 흐르는 하루입니다.' },
    { min: 70, label: '보통', pre: '무난하게 지나가는 하루입니다.' },
    { min: 60, label: '주의', pre: '작은 변수를 조심할 날입니다.' },
    { min: 0, label: '정체', pre: '잠시 쉬어 가는 날입니다.' }
  ];
  var TOTAL_TXT = {
    '최상': ['미뤄 두었던 일을 오늘 시작하면 생각보다 빠르게 풀립니다.', '주변에서 먼저 도움을 건네는 날입니다. 고맙다고 말해 두세요.', '고민하던 선택에 확신이 생깁니다. 결정을 미루지 마세요.'],
    '좋음': ['흐름이 좋아 작은 시도가 좋은 결과로 이어집니다.', '기분 좋은 소식이 하나 이상 들어오는 하루입니다.', '사람을 만나면 운이 트입니다. 약속을 하나 잡아 보세요.'],
    '보통': ['큰 변화보다는 하던 일을 정리하기 좋은 날입니다.', '서두르면 실수가 생깁니다. 순서를 정해 하나씩 처리하세요.', '평소보다 한 박자 천천히 움직이면 편안합니다.'],
    '주의': ['말 한마디가 오해로 이어질 수 있습니다. 확인 후 답하세요.', '지출이 새기 쉬운 날입니다. 결제 전에 한 번 더 보세요.', '체력이 떨어지기 쉬우니 일찍 쉬는 것이 좋습니다.'],
    '정체': ['오늘은 밀어붙이기보다 쉬어 가는 편이 낫습니다.', '기대를 낮추면 마음이 편해집니다. 작은 일에 집중하세요.', '답이 늦게 오는 날입니다. 재촉하지 말고 기다려 보세요.']
  };
  var MONEY_TXT = ['예상치 못한 작은 수입이 생길 수 있습니다.', '충동구매를 참으면 그 돈이 그대로 남습니다.', '미뤄 둔 결제·정산을 오늘 처리하면 마음이 가볍습니다.', '사람과의 약속에서 지출이 생기니 상한을 정해 두세요.', '아껴 둔 돈을 쓸 타이밍은 아닙니다. 오늘은 지키는 날입니다.'];
  var LOVE_TXT = ['먼저 연락하면 관계가 한 걸음 가까워집니다.', '상대의 말을 끝까지 듣는 것이 오늘의 열쇠입니다.', '솔직한 표현이 오해를 풀어 줍니다.', '혼자만의 시간이 오히려 관계를 편안하게 만듭니다.', '오래된 인연에게서 반가운 소식이 올 수 있습니다.'];
  var WORK_TXT = ['집중력이 좋아 어려운 업무를 처리하기 좋습니다.', '회의에서는 준비한 자료가 힘을 발휘합니다.', '상사·동료와의 협업에서 성과가 나는 날입니다.', '실수 하나를 미리 점검하면 큰 손실을 막습니다.', '새 제안은 오후로 미루면 반응이 좋습니다.'];
  var HEALTH_TXT = ['가벼운 스트레칭으로 컨디션을 올려 보세요.', '물을 자주 마시면 머리가 맑아집니다.', '점심을 가볍게 먹으면 오후가 편안합니다.', '잠이 부족합니다. 오늘은 일찍 눕는 것이 최고의 운.'];
  var ADVICE_TXT = ['오늘의 운은 참고용입니다. 결정은 내 몫입니다.', '좋은 기운은 나눌수록 커집니다. 칭찬 한마디를 건네 보세요.', '한 번 더 확인하는 습관이 오늘의 행운을 지켜 줍니다.', '작은 성공을 기록해 두면 다음 운을 부릅니다.'];

  function bandOf(score) {
    for (var i = 0; i < BANDS.length; i++) if (score >= BANDS[i].min) return BANDS[i];
    return BANDS[BANDS.length - 1];
  }

  function initTodayFortune() {
    var box = $('ftForm');
    if (!box) return;
    var segMode = box.querySelector('[data-seg="ftMode"]');
    var selZ = $('selZodiac');
    var selS = $('selStar');
    var inB = $('inFtBirth');
    var wrapZ = $('wrapZodiac');
    var wrapS = $('wrapStar');
    var outTitle = $('outFtTitle');
    var outDate = $('outFtDate');
    var outScore = $('outFtScore');
    var outSummary = $('outFtSummary');
    var outMini = $('outFtMini');
    var outLuck = $('outFtLuck');
    var outAdvice = $('outFtAdvice');
    var outBadge = $('outFtBadge');

    function mode() {
      var b = segMode ? segMode.querySelector('[aria-pressed="true"]') : null;
      return b ? b.getAttribute('data-value') : 'zodiac';
    }

    function render() {
      var m = mode();
      if (wrapZ) wrapZ.style.display = m === 'zodiac' ? '' : 'none';
      if (wrapS) wrapS.style.display = m === 'star' ? '' : 'none';

      var t = today();
      var dateKey = iso(t);
      var key, label, sub;
      if (m === 'zodiac') {
        var zi = selZ ? Number(selZ.value) : 0;
        key = 'z' + zi;
        label = ZODIAC_EMOJI[zi] + ' ' + ZODIAC[zi] + '띠';
        sub = '12지신 · ' + ZODIAC_H[zi];
      } else {
        var si = selS ? Number(selS.value) : 0;
        key = 's' + si;
        label = STARS[si].e + ' ' + STARS[si].k;
        sub = '별자리 운세';
      }

      var r = rng(hash(dateKey + '|' + key));
      var total = 58 + Math.floor(r() * 41);      // 58~98
      var money = clamp(total + Math.floor(r() * 21) - 10, 45, 99);
      var love = clamp(total + Math.floor(r() * 21) - 10, 45, 99);
      var work = clamp(total + Math.floor(r() * 21) - 10, 45, 99);
      var health = clamp(total + Math.floor(r() * 21) - 10, 45, 99);

      var band = bandOf(total);
      if (outTitle) outTitle.textContent = label + ' · 오늘의 운세';
      if (outDate) outDate.textContent = dateKo(t) + ' 기준 · ' + sub;
      if (outScore) outScore.innerHTML = total + '<small>점</small>';
      if (outBadge) outBadge.innerHTML = '<span class="badge ' +
        (band.label === '최상' || band.label === '좋음' ? 'good' : band.label === '보통' ? 'warn' : 'bad') +
        '"><span class="dot"></span>' + band.label + ' 운</span>';
      if (outSummary) outSummary.innerHTML = '<strong>' + band.pre + '</strong><p>' + pick(TOTAL_TXT[band.label], r()) + '</p>';

      if (outMini) {
        outMini.innerHTML = [
          ['금전운', money, pick(MONEY_TXT, r())],
          ['애정운', love, pick(LOVE_TXT, r())],
          ['직장운', work, pick(WORK_TXT, r())],
          ['건강운', health, pick(HEALTH_TXT, r())]
        ].map(function (row) {
          return '<div class="mini-score"><span>' + row[0] + '</span><strong>' + row[1] + '점</strong>' +
            '<div class="m-bar"><i style="width:' + row[1] + '%"></i></div>' +
            '<p class="inline-note" style="margin-top:6px">' + row[2] + '</p></div>';
        }).join('');
      }

      var color = pick(LUCK_COLORS, r());
      var nums = [];
      while (nums.length < 6) {
        var n = 1 + Math.floor(r() * 45);
        if (nums.indexOf(n) < 0) nums.push(n);
      }
      nums.sort(function (a, b) { return a - b; });
      if (outLuck) {
        outLuck.innerHTML = '<div class="luck-grid">' +
          '<div class="luck-item"><span>행운 컬러</span><strong><span class="swatch" style="background:' + color.c + '"></span>' + color.n + '</strong></div>' +
          '<div class="luck-item"><span>행운 숫자</span><strong style="font-size:13.5px">' + nums.join(' · ') + '</strong></div>' +
          '<div class="luck-item"><span>행운 아이템</span><strong>' + pick(LUCK_ITEMS, r()) + '</strong></div>' +
          '<div class="luck-item"><span>행운 시간</span><strong>' + pick(HOUR_LUCK, r()) + '</strong></div>' +
          '</div>';
      }
      if (outAdvice) outAdvice.textContent = pick(ADVICE_TXT, r());
    }

    if (segMode) {
      segMode.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-value]');
        if (!b) return;
        $$('button', segMode).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        render();
      });
    }
    if (selZ) selZ.addEventListener('change', render);
    if (selS) selS.addEventListener('change', render);
    if (inB) {
      inB.addEventListener('change', function () {
        var d = parseISO(inB.value);
        if (!d) return;
        var lunar = solarToLunar(d);
        var by = lunar ? lunar.y : d.getFullYear();
        var zi = ((by - 4) % 12 + 12) % 12;
        if (selZ) selZ.value = String(zi);
        var si = starIndex(d.getMonth() + 1, d.getDate());
        if (selS) selS.value = String(si);
        render();
      });
    }
    render();
  }

  function starIndex(m, d) {
    for (var i = 0; i < STARS.length; i++) {
      var s = STARS[i].s, t = STARS[i].t;
      if (s[0] <= t[0]) {
        if ((m > s[0] || (m === s[0] && d >= s[1])) && (m < t[0] || (m === t[0] && d <= t[1]))) return i;
      } else {
        if ((m > s[0] || (m === s[0] && d >= s[1])) || (m < t[0] || (m === t[0] && d <= t[1]))) return i;
      }
    }
    return 0;
  }

  /* ---------------------------------------------------------------- 궁합 */
  var SAENG = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 0 };  // 목생화 화생토 토생금 금생수 수생목
  var GEUK = { 0: 2, 1: 3, 2: 4, 3: 0, 4: 1 };   // 목극토 화극금 토극수 금극목 수극화
  var YUKHAP = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
  var SAMHAP = [[8, 0, 4], [11, 3, 7], [2, 6, 10], [5, 9, 1]];
  var CHUNG = [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]];
  var WONJIN = [[0, 7], [1, 6], [2, 9], [3, 8], [4, 11], [5, 10]];

  function pairIn(list, a, b) {
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (p.length === 2 && ((p[0] === a && p[1] === b) || (p[0] === b && p[1] === a))) return true;
    }
    return false;
  }
  function samhapHit(a, b) {
    for (var i = 0; i < SAMHAP.length; i++) if (SAMHAP[i].indexOf(a) >= 0 && SAMHAP[i].indexOf(b) >= 0) return true;
    return false;
  }

  function initChemistry() {
    var form = $('chemForm');
    if (!form) return;
    var inA = $('inNameA'), inB = $('inNameB');
    var dA = $('inDateA'), dB = $('inDateB');
    var outScore = $('outChemScore');
    var outHearts = $('outChemHearts');
    var outLine = $('outChemLine');
    var outTag = $('outChemTag');
    var outA = $('outPersonA'), outB = $('outPersonB');
    var outDetail = $('outChemDetail');
    var outTip = $('outChemTip');
    var btn = $('btnShareChem');
    var copied = $('chemCopied');

    if (dA && !dA.value) dA.value = '1995-05-15';
    if (dB && !dB.value) dB.value = '1996-08-21';

    function person(date, name) {
      var s = sajuOf(date, null, 0);
      var el = STEM_EL[s.dayStem];
      var zi = ((s.ganjiYear - 4) % 12 + 12) % 12;
      return { s: s, el: el, zi: zi, name: name || '이름 없음' };
    }

    function render() {
      var a = parseISO(dA && dA.value), b = parseISO(dB && dB.value);
      if (!a || !b) {
        outLine.textContent = '두 사람의 생년월일을 모두 입력해 주세요.';
        return;
      }
      var p1 = person(a, (inA && inA.value.trim()) || '첫 번째 사람');
      var p2 = person(b, (inB && inB.value.trim()) || '두 번째 사람');

      var elScore = 0, elTxt = '';
      if (p1.el === p2.el) {
        elScore = 6;
        elTxt = '같은 ' + EL[p1.el] + '의 기운으로 편안하지만 자극은 적은 사이입니다.';
      } else if (SAENG[p1.el] === p2.el) {
        elScore = 12;
        elTxt = p1.name + '님의 ' + EL[p1.el] + ' 기운이 ' + p2.name + '님의 ' + EL[p2.el] + ' 기운을 살려 줍니다.';
      } else if (SAENG[p2.el] === p1.el) {
        elScore = 12;
        elTxt = p2.name + '님의 ' + EL[p2.el] + ' 기운이 ' + p1.name + '님의 ' + EL[p1.el] + ' 기운을 살려 줍니다.';
      } else if (GEUK[p1.el] === p2.el) {
        elScore = -6;
        elTxt = p1.name + '님의 기운이 ' + p2.name + '님을 누르는 구조라 주도권 다툼이 생기기 쉽습니다.';
      } else {
        elScore = -6;
        elTxt = p2.name + '님의 기운이 ' + p1.name + '님을 누르는 구조라 서운함이 쌓이기 쉽습니다.';
      }

      var ziScore = 0, ziTxt = '';
      if (pairIn(YUKHAP, p1.zi, p2.zi)) { ziScore = 12; ziTxt = '육합(六合) — 서로를 끌어당기는 짝입니다.'; }
      else if (samhapHit(p1.zi, p2.zi)) { ziScore = 10; ziTxt = '삼합(三合) — 목표가 같을 때 큰 힘을 냅니다.'; }
      else if (pairIn(CHUNG, p1.zi, p2.zi)) { ziScore = -10; ziTxt = '상충(相沖) — 부딪히지만 서로를 자극해 성장합니다.'; }
      else if (pairIn(WONJIN, p1.zi, p2.zi)) { ziScore = -7; ziTxt = '원진(元嗔) — 사소한 오해가 쌓이기 쉬운 짝입니다.'; }
      else { ziScore = 2; ziTxt = '무난한 띠 조합으로, 노력한 만큼 가까워집니다.'; }

      var nameBonus = 0;
      var na = (inA && inA.value.trim()) ? inA.value.trim().replace(/\s/g, '').length : 0;
      var nb = (inB && inB.value.trim()) ? inB.value.trim().replace(/\s/g, '').length : 0;
      if (na && nb) nameBonus = (na + nb) % 5 - 2;

      var score = clamp(62 + elScore + ziScore + nameBonus, 42, 98);
      var hearts = score >= 90 ? 5 : score >= 80 ? 4 : score >= 68 ? 3 : score >= 55 ? 2 : 1;
      var line, tip;
      if (score >= 90) {
        line = '서로의 빈 곳을 채워 주는, 보기 드문 짝입니다.';
        tip = '한쪽이 리드하기보다 번갈아 맞춰 줄 때 오래갑니다.';
      } else if (score >= 80) {
        line = '말이 잘 통하고 함께 있으면 편안한 인연입니다.';
        tip = '고마움을 말로 표현하면 관계가 더 단단해집니다.';
      } else if (score >= 68) {
        line = '노력이 필요한 만큼 가능성도 큰 사이입니다.';
        tip = '서로 다른 점을 고치려 하지 말고 역할을 나눠 보세요.';
      } else if (score >= 55) {
        line = '다름을 인정하면 오래가는 사이입니다.';
        tip = '감정이 올라올 때 한 박자 쉬어 가는 규칙을 정해 보세요.';
      } else {
        line = '속도를 조절하면 나쁘지 않은 사이입니다.';
        tip = '기대를 조금 낮추고 작은 약속부터 지켜 보세요.';
      }

      outScore.innerHTML = score + '<small>점</small>';
      outHearts.textContent = '♥'.repeat(hearts) + '♡'.repeat(5 - hearts);
      outLine.textContent = line;
      if (outTag) outTag.textContent = '오행 궁합 ' + elScore + '점 · 띠 궁합 ' + ziScore + '점';
      if (outA) {
        outA.innerHTML = '<div class="pb-name">' + p1.name + '</div>' +
          '<div class="pb-el">' + ZODIAC_EMOJI[p1.zi] + ' ' + ZODIAC[p1.zi] + '띠 · ' + EL[p1.el] + '(' + EL_HAN[p1.el] + ') 일간</div>';
      }
      if (outB) {
        outB.innerHTML = '<div class="pb-name">' + p2.name + '</div>' +
          '<div class="pb-el">' + ZODIAC_EMOJI[p2.zi] + ' ' + ZODIAC[p2.zi] + '띠 · ' + EL[p2.el] + '(' + EL_HAN[p2.el] + ') 일간</div>';
      }
      if (outDetail) {
        outDetail.innerHTML = '<ul><li><b>오행</b> — ' + elTxt + '</li><li><b>띠</b> — ' + ziTxt + '</li>' +
          '<li><b>일간</b> — ' + p1.name + ' ' + STEM[p1.s.dayStem] + EL_HAN[STEM_EL[p1.s.dayStem]] +
          ', ' + p2.name + ' ' + STEM[p2.s.dayStem] + EL_HAN[STEM_EL[p2.s.dayStem]] + '의 조합입니다.</li></ul>';
      }
      if (outTip) outTip.textContent = tip;

      if (btn) {
        btn.dataset.share = p1.name + ' × ' + p2.name + ' 궁합 ' + score + '점 — ' + line + ' (운세 툴 허브)';
      }
    }

    ['input', 'change'].forEach(function (ev) {
      [inA, inB, dA, dB].forEach(function (el) { if (el) el.addEventListener(ev, render); });
    });

    if (btn && copied) {
      btn.addEventListener('click', function () {
        var text = btn.dataset.share || '우리 둘 궁합 테스트';
        var done = function () {
          copied.textContent = '결과를 복사했습니다. 붙여넣기로 공유해 보세요.';
          setTimeout(function () { copied.textContent = ''; }, 2600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
        } else {
          fallbackCopy(text, done);
        }
      });
    }
    render();
  }

  function fallbackCopy(text, done) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      done();
    } catch (e) { /* 복사 미지원 */ }
  }

  /* ---------------------------------------------------------------- 로또 */
  function ballClass(n) {
    if (n <= 10) return 'c1';
    if (n <= 20) return 'c2';
    if (n <= 30) return 'c3';
    if (n <= 40) return 'c4';
    return 'c5';
  }
  function ballsHTML(nums) {
    return nums.map(function (n) { return '<span class="ball ' + ballClass(n) + '">' + n + '</span>'; }).join('');
  }

  function initLotto() {
    var box = $('lottoForm');
    if (!box) return;
    var segMode = box.querySelector('[data-seg="lottoMode"]');
    var segOdd = $('segOddEven');
    var selGames = $('selGames');
    var wrapFixed = $('wrapFixed');
    var wrapEx = $('wrapEx');
    var wrapOdd = $('wrapOdd');
    var gridFixed = $('gridFixed');
    var gridEx = $('gridEx');
    var outGames = $('outGames');
    var btnGen = $('btnGen');
    var cntFixed = $('cntFixed');
    var cntEx = $('cntEx');
    var inDream = $('inDream');
    var dreamList = $('dreamList');
    var dreamNums = $('dreamNums');
    var btnDream = $('btnDreamGen');
    var dreamCount = $('dreamCount');

    var fixed = [], excluded = [];

    function mode() {
      var b = segMode ? segMode.querySelector('[aria-pressed="true"]') : null;
      return b ? b.getAttribute('data-value') : 'random';
    }

    function buildGrid(el, arr, kind) {
      if (!el) return;
      var html = '';
      for (var i = 1; i <= 45; i++) {
        var on = arr.indexOf(i) >= 0;
        html += '<button type="button" data-n="' + i + '" aria-pressed="' + (on ? 'true' : 'false') + '"' +
          (kind === 'ex' && on ? ' class="is-ex"' : '') + '>' + i + '</button>';
      }
      el.innerHTML = html;
    }

    function syncMeta() {
      if (cntFixed) cntFixed.textContent = fixed.length + '/5';
      if (cntEx) cntEx.textContent = excluded.length + '/20';
      buildGrid(gridFixed, fixed, 'fixed');
      buildGrid(gridEx, excluded, 'ex');
    }

    function updateModeView() {
      var m = mode();
      if (wrapFixed) wrapFixed.style.display = m === 'semi' ? '' : 'none';
      if (wrapEx) wrapEx.style.display = m === 'semi' ? '' : 'none';
      if (wrapOdd) wrapOdd.style.display = m === 'balance' ? '' : 'none';
    }

    function oddEvenTarget() {
      if (!segOdd) return null;
      var b = segOdd.querySelector('[aria-pressed="true"]');
      if (!b) return null;
      var v = b.getAttribute('data-value');
      if (v === 'auto') return null;
      var parts = v.split(':');
      return [Number(parts[0]), Number(parts[1])];
    }

    function genOne(rnd, opts) {
      var fix = opts.fixedList || [];
      var ex = opts.exList || [];
      var filter = !!opts.filter;
      var pool = [];
      for (var i = 1; i <= 45; i++) {
        if (ex.indexOf(i) < 0 && fix.indexOf(i) < 0) pool.push(i);
      }
      var need = 6 - fix.length;
      if (pool.length < need) return null;

      // 고정수 때문에 달성할 수 없는 홀짝 목표는 무시합니다.
      var target = opts.oddTarget;
      if (target) {
        var oddFixed = fix.filter(function (n) { return n % 2 === 1; }).length;
        var needOdd = target[0] - oddFixed;
        if (needOdd < 0 || needOdd > need) target = null;
      }

      function draw() {
        var extra = [], copy = pool.slice();
        for (var k = 0; k < need; k++) {
          extra.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0]);
        }
        return fix.concat(extra).sort(function (a, b) { return a - b; });
      }
      function oddCount(nums) {
        return nums.filter(function (n) { return n % 2 === 1; }).length;
      }

      // 완전 랜덤·반자동: 조건 없이 한 번에 뽑습니다(홀짝 목표는 밸런스 모드 전용).
      if (!filter) return draw();

      for (var attempt = 0; attempt < 800; attempt++) {
        var nums = draw();
        var sum = nums.reduce(function (a, b) { return a + b; }, 0);
        if (sum < 100 || sum > 180) continue;
        var run = 1, maxRun = 1;
        for (var j = 1; j < nums.length; j++) {
          if (nums[j] === nums[j - 1] + 1) { run++; maxRun = Math.max(maxRun, run); } else run = 1;
        }
        if (maxRun >= 3) continue;
        if (target && oddCount(nums) !== target[0]) continue;
        return nums;
      }
      // 조건이 너무 엄격할 때: 합계·연속수 조건을 풀고 홀짝만 유지해 재시도
      for (var a2 = 0; a2 < 600; a2++) {
        var n2 = draw();
        if (target && oddCount(n2) !== target[0]) continue;
        return n2;
      }
      // 홀짝까지 포기하고 가능한 아무 조합
      return draw();
    }

    function renderGames() {
      if (!outGames) return;
      var games = selGames ? Number(selGames.value) : 5;
      var rnd = rng((Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0);
      var html = '';
      var target = oddEvenTarget();
      var isSemi = mode() === 'semi';
      var isBal = mode() === 'balance';
      for (var g = 0; g < games; g++) {
        var nums = genOne(rnd, {
          oddTarget: isBal ? target : null,
          filter: isBal,
          fixedList: isSemi ? fixed : [],
          exList: isSemi ? excluded : []
        });
        if (!nums) {
          html += '<div class="game"><div class="g-head"><b>' + (g + 1) + '게임</b></div>' +
            '<p class="inline-note">제외수가 너무 많아 조합을 만들 수 없습니다. 제외수를 줄이거나 고정수를 해제해 주세요.</p></div>';
          continue;
        }
        var odd = nums.filter(function (n) { return n % 2 === 1; }).length;
        var sum = nums.reduce(function (a, b) { return a + b; }, 0);
        html += '<div class="game"><div class="g-head"><b>' + (g + 1) + '게임</b>' +
          '<span class="g-pattern">홀' + odd + ' 짝' + (6 - odd) + ' · 합 ' + sum + '</span></div>' +
          '<div class="ball-row">' + ballsHTML(nums) + '</div></div>';
      }
      outGames.innerHTML = html;
    }

    function renderDreams(q) {
      if (!dreamList) return;
      q = (q || '').trim();
      var items = (D.dreams || []).filter(function (d) {
        return !q || d.k.indexOf(q) >= 0 || d.d.indexOf(q) >= 0;
      });
      if (dreamCount) dreamCount.textContent = items.length + '개 키워드';
      if (!items.length) {
        dreamList.innerHTML = '<p class="inline-note">검색 결과가 없습니다. 다른 키워드로 찾아보세요.</p>';
        return;
      }
      dreamList.innerHTML = items.map(function (d) {
        return '<div class="dream-item"><h3>' + d.k + ' 꿈</h3><p>' + d.d + '</p>' +
          '<div class="dream-nums">' + d.n.map(function (n) { return '<b>' + n + '</b>'; }).join('') + '</div></div>';
      }).join('');
    }

    if (segMode) {
      segMode.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-value]');
        if (!b) return;
        $$('button', segMode).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        updateModeView();
        renderGames();
      });
    }
    if (segOdd) {
      segOdd.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-value]');
        if (!b) return;
        $$('button', segOdd).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        renderGames();
      });
    }
    if (selGames) selGames.addEventListener('change', renderGames);
    if (gridFixed) {
      gridFixed.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-n]');
        if (!b) return;
        var n = Number(b.getAttribute('data-n'));
        var i = fixed.indexOf(n);
        if (i >= 0) fixed.splice(i, 1);
        else {
          if (fixed.length >= 5) return;
          var ei = excluded.indexOf(n);
          if (ei >= 0) excluded.splice(ei, 1);
          fixed.push(n);
        }
        syncMeta();
        renderGames();
      });
    }
    if (gridEx) {
      gridEx.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-n]');
        if (!b) return;
        var n = Number(b.getAttribute('data-n'));
        var i = excluded.indexOf(n);
        if (i >= 0) excluded.splice(i, 1);
        else {
          if (excluded.length >= 20) return;
          var fi = fixed.indexOf(n);
          if (fi >= 0) fixed.splice(fi, 1);
          excluded.push(n);
        }
        syncMeta();
        renderGames();
      });
    }
    if (btnGen) btnGen.addEventListener('click', renderGames);
    if (inDream) inDream.addEventListener('input', function () { renderDreams(inDream.value); });
    if (btnDream) {
      btnDream.addEventListener('click', function () {
        var rnd = rng((Date.now() ^ 0x9e3779b9) >>> 0);
        var nums = genOne(rnd, { oddTarget: null, filter: false });
        if (dreamNums) dreamNums.innerHTML = nums ? '<div class="ball-row">' + ballsHTML(nums) + '</div>' : '';
      });
    }

    updateModeView();
    syncMeta();
    renderGames();
    renderDreams('');
  }

  /* ---------------------------------------------------------------- 만 나이 · D-day */
  function initAgeDday() {
    var form = $('ageForm');
    if (!form) return;
    var segCal = form.querySelector('[data-seg="ageCal"]');
    var inBirth = $('inBirthAge');
    var chkWrap = $('ageLeapWrap');
    var chkLeap = $('chkLeapAge');
    var outAge = $('outAge');
    var outAgeLine = $('outAgeLine');
    var outGrid = $('outAgeGrid');
    var outBday = $('outBday');
    var outZodiac = $('outZodiacAge');

    var inStart = $('inAnnivStart');
    var outAnniv = $('outAnniv');

    var inTarget = $('inTargetDate');
    var outDday = $('outDday');
    var outDdayNote = $('outDdayNote');

    if (inBirth && !inBirth.value) inBirth.value = '1994-01-13';
    if (inStart && !inStart.value) inStart.value = iso(today());
    if (inTarget && !inTarget.value) inTarget.value = iso(addDays(today(), 30));

    function ageCal() {
      var b = segCal ? segCal.querySelector('[aria-pressed="true"]') : null;
      return b ? b.getAttribute('data-value') : 'solar';
    }

    function renderAge() {
      var d = parseISO(inBirth && inBirth.value);
      if (!d) { outAge.textContent = '-'; return; }
      var solar = d;
      if (ageCal() === 'lunar') {
        var conv = lunarToSolar(d.getFullYear(), d.getMonth() + 1, d.getDate(), chkLeap && chkLeap.checked);
        if (!conv) { outAgeLine.textContent = '음력 날짜를 확인해 주세요. (음력 1930~2049년 지원)'; return; }
        solar = conv;
      }
      var t = today();
      if (solar > t) {
        outAge.textContent = '-';
        outAgeLine.textContent = '아직 태어나지 않은 날짜입니다.';
        return;
      }
      var full = t.getFullYear() - solar.getFullYear();
      var hadBday = (t.getMonth() > solar.getMonth()) ||
        (t.getMonth() === solar.getMonth() && t.getDate() >= solar.getDate());
      var man = hadBday ? full : full - 1;
      outAge.innerHTML = man + '<small>세</small>';
      outAgeLine.textContent = '만 나이 기준 · 연 나이 ' + (t.getFullYear() - solar.getFullYear()) + '세 · 태어난 지 ' + num(diffDays(solar, t) + 1) + '일';

      var lunar = solarToLunar(solar);
      var byYear = lunar ? lunar.y : solar.getFullYear();
      var zi = ((byYear - 4) % 12 + 12) % 12;
      var si = starIndex(solar.getMonth() + 1, solar.getDate());

      // 다음 생일
      var next = new Date(t.getFullYear(), solar.getMonth(), solar.getDate());
      if (diffDays(t, next) < 0) next = new Date(t.getFullYear() + 1, solar.getMonth(), solar.getDate());
      var dLeft = diffDays(t, next);

      if (outBday) {
        outBday.innerHTML = '<div class="luck-grid">' +
          '<div class="luck-item"><span>다음 생일</span><strong>' + dateKoShort(next) + '</strong></div>' +
          '<div class="luck-item"><span>남은 날</span><strong>' + (dLeft === 0 ? '오늘! 🎉' : 'D-' + dLeft) + '</strong></div>' +
          '<div class="luck-item"><span>만 나이</span><strong>' + man + '세</strong></div>' +
          '<div class="luck-item"><span>연 나이</span><strong>' + (t.getFullYear() - solar.getFullYear()) + '세</strong></div>' +
          '</div>';
      }
      if (outZodiac) {
        outZodiac.innerHTML = '<div class="luck-grid">' +
          '<div class="luck-item"><span>띠 (음력년 기준)</span><strong>' + ZODIAC_EMOJI[zi] + ' ' + ZODIAC[zi] + '띠</strong></div>' +
          '<div class="luck-item"><span>별자리</span><strong>' + STARS[si].e + ' ' + STARS[si].k + '</strong></div>' +
          '<div class="luck-item"><span>양력 생일</span><strong style="font-size:13px;font-weight:700">' + dateKoShort(solar) + '</strong></div>' +
          '<div class="luck-item"><span>음력 생일</span><strong style="font-size:13px;font-weight:700">' + (lunar ? lunar.m + '월 ' + lunar.d + '일' + (lunar.leap ? ' (윤달)' : '') : '-') + '</strong></div>' +
          '</div>';
      }
      if (outGrid) {
        var rows = '';
        if (lunar) {
          var ja = lunar.m + '월 ' + lunar.d + '일' + (lunar.leap ? ' (윤달)' : '');
          var sa = (solar.getMonth() + 1) + '월 ' + solar.getDate() + '일';
          rows = '<div class="table-wrap"><table><caption>생일 기준 정보</caption><tbody>' +
            '<tr><td>양력 생일</td><td>' + solar.getFullYear() + '년 ' + sa + '</td></tr>' +
            '<tr><td>음력 생일</td><td>' + lunar.y + '년 ' + ja + '</td></tr>' +
            '<tr><td>태어난 요일</td><td>' + WD[solar.getDay()] + '요일</td></tr>' +
            '<tr><td>살아온 날</td><td>' + num(diffDays(solar, t) + 1) + '일</td></tr>' +
            '<tr><td>만 나이</td><td><strong>' + man + '세</strong></td></tr>' +
            '</tbody></table></div>';
        }
        outGrid.innerHTML = rows;
      }
    }

    function renderAnniv() {
      var start = parseISO(inStart && inStart.value);
      if (!start || !outAnniv) return;
      var t = today();
      var marks = [100, 200, 300, 500, 1000, 2000, 3000, 5000, 10000];
      var rows = marks.map(function (n) {
        var d = addDays(start, n - 1);
        var left = diffDays(t, d);
        var state = left > 0 ? 'D-' + left : (left === 0 ? '오늘' : left + '일 지남');
        return '<tr><td>' + num(n) + '일</td><td>' + d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) + ' (' + WD[d.getDay()] + ')</td><td>' + state + '</td></tr>';
      }).join('');
      var yearMarks = [1, 2, 3, 5, 10].map(function (y) {
        var d = new Date(start.getFullYear() + y, start.getMonth(), start.getDate());
        var left = diffDays(t, d);
        var state = left > 0 ? 'D-' + left : (left === 0 ? '오늘' : left + '일 지남');
        return '<tr><td>' + y + '주년</td><td>' + d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) + ' (' + WD[d.getDay()] + ')</td><td>' + state + '</td></tr>';
      }).join('');
      outAnniv.innerHTML = '<div class="table-wrap"><table><caption>100일 단위 기념일</caption>' +
        '<thead><tr><th scope="col">기념일</th><th scope="col">날짜</th><th scope="col">오늘 기준</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>' +
        '<div class="table-wrap mt-16"><table><caption>주년 기념일</caption>' +
        '<thead><tr><th scope="col">기념일</th><th scope="col">날짜</th><th scope="col">오늘 기준</th></tr></thead>' +
        '<tbody>' + yearMarks + '</tbody></table></div>';
    }

    function renderDday() {
      var target = parseISO(inTarget && inTarget.value);
      if (!target || !outDday) return;
      var t = today();
      var left = diffDays(t, target);
      var label, cls;
      if (left === 0) { label = 'D-Day'; cls = 'good'; }
      else if (left > 0) { label = 'D-' + left; cls = 'good'; }
      else { label = 'D+' + (-left); cls = ''; }
      outDday.innerHTML = '<div class="score-hero"><div class="score-num" style="width:auto;min-width:120px;padding:0 18px;font-size:30px">' + label + '</div>' +
        '<div class="score-copy"><strong>' + dateKo(target) + '</strong>' +
        '<p>' + (left === 0 ? '바로 오늘입니다.' : left > 0 ? left + '일 남았습니다.' : (-left) + '일 지났습니다.') + '</p></div></div>';
      if (outDdayNote) {
        outDdayNote.className = 'notice ' + cls;
        outDdayNote.textContent = left >= 0
          ? '주말·공휴일을 제외한 평일 기준은 영업일 계산기에서 확인하세요.'
          : '지난 날짜를 입력하면 D+로 표시됩니다.';
      }
    }

    if (segCal) {
      segCal.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-value]');
        if (!b) return;
        $$('button', segCal).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        if (chkWrap) chkWrap.style.display = b.getAttribute('data-value') === 'lunar' ? '' : 'none';
        renderAge();
      });
    }
    [inBirth, chkLeap].forEach(function (el) {
      if (!el) return;
      el.addEventListener('change', renderAge);
      if (el.tagName === 'INPUT') el.addEventListener('input', renderAge);
    });
    [inStart, inTarget].forEach(function (el) {
      if (!el) return;
      el.addEventListener('change', function () { renderAnniv(); renderDday(); });
      el.addEventListener('input', function () { renderAnniv(); renderDday(); });
    });

    renderAge();
    renderAnniv();
    renderDday();
  }

  /* ---------------------------------------------------------------- 시작 */
  function boot() {
    initSaju();
    initTodayFortune();
    initChemistry();
    initLotto();
    initAgeDday();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  // 검증용 (브라우저 콘솔/테스트에서 계산 엔진 확인)
  window.FORTUNE_ENGINE = {
    sajuOf: sajuOf, lunarToSolar: lunarToSolar, solarToLunar: solarToLunar,
    starIndex: starIndex, termBoundaries: termBoundaries, jdn: jdn, gzLine: gzLine
  };
})();

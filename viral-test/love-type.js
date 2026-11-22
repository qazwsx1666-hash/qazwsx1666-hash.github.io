/* ==========================================================================
   연애 애착유형 · 썸 스타일 테스트
   4유형: 안정형 · 불안형 · 회피형 · 혼란형
   ========================================================================== */
(function () {
  "use strict";

  var Q = [
    {
      q: "연인의 답장이 3시간째 없다.",
      hint: "가장 먼저 드는 생각이나 행동으로.",
      opts: [
        { t: "바쁜가 보다 싶어 내 할 일을 한다", v: "secure" },
        { t: "뭐 잘못했나 싶어 대화창을 계속 연다", v: "anxious" },
        { t: "오히려 좋다. 나도 내 시간을 쓴다", v: "avoidant" },
        { t: "괜찮은 척하다가 결국 서운함을 터뜨린다", v: "disorganized" }
      ]
    },
    {
      q: "썸이 시작될 때 나는?",
      hint: "마음이 커지는 초반을 떠올려 보세요.",
      opts: [
        { t: "천천히 알아가면서 편하게 다가간다", v: "secure" },
        { t: "하루 종일 그 사람 생각이 나서 먼저 연락한다", v: "anxious" },
        { t: "좋아도 티를 안 낸다. 거리를 둔다", v: "avoidant" },
        { t: "좋아서 가까이 가다가 갑자기 도망가고 싶다", v: "disorganized" }
      ]
    },
    {
      q: "갈등이 생기면 나는?",
      hint: "싸운 직후의 반응.",
      opts: [
        { t: "바로 대화로 풀자고 말한다", v: "secure" },
        { t: "내가 뭘 잘못했나 자책부터 한다", v: "anxious" },
        { t: "일단 피하고 시간이 지나길 기다린다", v: "avoidant" },
        { t: "감정이 앞서다가 나중에 후회한다", v: "disorganized" }
      ]
    },
    {
      q: "애정 표현은 어떤 편인가요?",
      hint: "말과 행동 모두 포함해서.",
      opts: [
        { t: "말과 행동으로 자연스럽게 표현한다", v: "secure" },
        { t: "상대 반응을 살피며 조심스럽게 표현한다", v: "anxious" },
        { t: "표현이 어색해서 행동으로만 한다", v: "avoidant" },
        { t: "확 몰아주다가 갑자기 식어버린다", v: "disorganized" }
      ]
    },
    {
      q: "연락 빈도, 나에게 편한 건?",
      hint: "억지로 맞추지 말고 솔직하게.",
      opts: [
        { t: "하루 한두 번, 서로의 하루를 나누는 정도", v: "secure" },
        { t: "수시로 확인하고 싶다", v: "anxious" },
        { t: "연락이 없어도 불안하지 않다", v: "avoidant" },
        { t: "하고 싶다가도 귀찮아져서 미루게 된다", v: "disorganized" }
      ]
    },
    {
      q: "다툰 다음 날, 나는?",
      hint: "잠들기 전이나 다음 날 아침.",
      opts: [
        { t: "정리하고 다음 단계로 넘어간다", v: "secure" },
        { t: "잠을 못 자고 대화를 되감아 본다", v: "anxious" },
        { t: "다른 일에 몰두해서 잊는다", v: "avoidant" },
        { t: "관계 자체를 의심하고 정리하고 싶어진다", v: "disorganized" }
      ]
    },
    {
      q: "관계가 깊어질 때 나는?",
      hint: "서로를 더 알아갈수록.",
      opts: [
        { t: "편안하고 기쁘다", v: "secure" },
        { t: "잃을까 봐 두려워진다", v: "anxious" },
        { t: "숨 쉴 공간이 필요해진다", v: "avoidant" },
        { t: "가까워지면 밀어내고 싶어진다", v: "disorganized" }
      ]
    },
    {
      q: "이별 후 나는?",
      hint: "지난 경험을 떠올려 보세요.",
      opts: [
        { t: "슬프지만 일상을 회복한다", v: "secure" },
        { t: "오래 붙잡고 후회한다", v: "anxious" },
        { t: "쿨하게 정리한 척하지만 마음에 남긴다", v: "avoidant" },
        { t: "그리움과 분노가 번갈아 온다", v: "disorganized" }
      ]
    },
    {
      q: "연인에게 힘든 일이 생겼다.",
      hint: "위로하는 방식으로.",
      opts: [
        { t: "옆에서 함께 해결하려 한다", v: "secure" },
        { t: "내가 부족했나 걱정한다", v: "anxious" },
        { t: "혼자 정리할 시간을 준다", v: "avoidant" },
        { t: "어떻게 반응해야 할지 몰라 물러선다", v: "disorganized" }
      ]
    },
    {
      q: "이상적인 관계는?",
      hint: "지금 가장 끌리는 그림.",
      opts: [
        { t: "각자의 일상을 공유하며 편안하게", v: "secure" },
        { t: "하루 종일 함께 있어도 좋다", v: "anxious" },
        { t: "각자의 공간이 확실히 보장되는 관계", v: "avoidant" },
        { t: "가깝지만 안전한 거리, 그게 어렵다", v: "disorganized" }
      ]
    }
  ];

  var TYPES = {
    secure: {
      name: "안정형",
      sub: "편안하게 사랑하는 사람",
      emoji: "🌿",
      desc: "관계가 가까워져도 불안하지 않고, 멀어져도 무너지지 않습니다. 좋아하는 마음을 말로 표현할 수 있고, 갈등이 생기면 피하지 않고 대화를 시도합니다. 상대가 힘들 때도 같이 흔들리지 않고 버텨줍니다.",
      inner: "속마음은 “나는 사랑받을 만한 사람이고, 이 관계는 대화로 풀 수 있다”에 가깝습니다. 그래서 상대의 연락이 늦어도 ‘나를 싫어하나’로 해석하지 않습니다.",
      style: "썸에서도 계산이 적습니다. 좋아하면 좋아한다고 말하고, 아니면 선을 긋습니다. 상대 입장에서는 가장 편안한 유형이지만, 가끔은 밀당이 없어서 설렘이 부족하다는 말을 듣기도 합니다.",
      tips: ["상대가 불안해할 때 “괜찮아”보다 “내가 여기 있어”라고 말해 주세요.", "편안함이 무관심으로 보이지 않게 애정 표현을 조금 더 자주.", "상대의 애착유형을 이해하면 갈등이 줄어듭니다."],
      tags: ["#안정형", "#신뢰", "#대화로해결", "#편안한연애"],
      best: "불안형",
      bestWhy: "당신의 일관된 반응이 상대의 불안을 낮춰줍니다.",
      worst: "회피형",
      worstWhy: "표현을 피하는 상대를 이해하려다 지칠 수 있어요.",
      quote: "“싸워도 결국 다시 이야기하면 돼.”"
    },
    anxious: {
      name: "불안형",
      sub: "사랑이 간절해서 더 조심스러운 사람",
      emoji: "🌊",
      desc: "관계가 흔들리면 온 신경이 그쪽으로 쏠립니다. 답장이 늦으면 이유를 찾고, 표정이 굳으면 내가 뭘 잘못했나 되짚습니다. 좋아하는 마음이 큰 만큼 상처도 크게 받는 유형입니다.",
      inner: "속마음은 “이 사람이 떠나면 나는 괜찮지 않을 것 같다”에 가깝습니다. 그래서 확인하고 싶은 마음이 앞서지만, 그 마음을 그대로 쏟으면 상대는 압박으로 느낄 수 있습니다.",
      style: "썸에서 먼저 연락하고 먼저 다가가는 쪽입니다. 상대의 작은 변화도 빨리 알아차려서 세심하다는 말을 듣지만, 확인이 반복되면 “너무 급하다”는 인상을 줄 수 있습니다.",
      tips: ["확인하고 싶을 때 10분만 기다려 보세요. 대부분 그 사이에 답이 옵니다.", "서운함은 “너는 왜 그래”보다 “나는 이럴 때 불안해”로 말하세요.", "연인 외의 관계와 취미를 충분히 남겨두면 마음이 덜 쏠립니다."],
      tags: ["#불안형", "#확인욕구", "#세심함", "#애정과다"],
      best: "안정형",
      bestWhy: "흔들리지 않는 반응이 가장 큰 안정제가 됩니다.",
      worst: "회피형",
      worstWhy: "다가가면 물러서고, 물러서면 더 매달리는 악순환.",
      quote: "“이렇게까지 좋아하는데, 괜찮은 거야?”"
    },
    avoidant: {
      name: "회피형",
      sub: "가까워질수록 물러서는 사람",
      emoji: "🧊",
      desc: "혼자 있는 시간이 꼭 필요합니다. 관계가 깊어지면 부담이 올라오고, 감정을 말하라는 순간에 말문이 막힙니다. 좋아하지 않는 게 아니라, 가까워지는 속도가 두려운 쪽입니다.",
      inner: "속마음은 “기대면 실망한다”에 가깝습니다. 그래서 스스로를 지키려고 거리를 두지만, 상대에게는 차갑게 비칩니다.",
      style: "썸에서도 티를 잘 안 냅니다. 먼저 연락하기보다 받는 쪽이고, 마음이 커질수록 오히려 조용해집니다. 상대는 “나를 안 좋아하나”라고 오해하기 쉽습니다.",
      tips: ["필요한 공간을 미리 말해 두세요. “하루만 혼자 있고 싶어”는 거절이 아닙니다.", "감정을 말하는 연습을 짧게. “좀 부담스러웠어” 한마디면 충분합니다.", "상대가 확인을 요구할 때는 침묵 대신 짧은 답이라도 주세요."],
      tags: ["#회피형", "#혼자만의시간", "#거리두기", "#표현서툼"],
      best: "안정형",
      bestWhy: "재촉하지 않고 기다려 주는 사람과 오래 갑니다.",
      worst: "불안형",
      worstWhy: "확인과 회피가 서로를 더 불안하게 만듭니다.",
      quote: "“좋아하는데, 자꾸 숨고 싶어.”"
    },
    disorganized: {
      name: "혼란형",
      sub: "끌림과 두려움이 같이 오는 사람",
      emoji: "🌪️",
      desc: "가까워지고 싶은 마음과 밀어내고 싶은 마음이 동시에 올라옵니다. 확 몰아주다가 갑자기 식고, 애정을 확인받고 싶다가도 그 상황이 부담스러워집니다. 감정의 진폭이 큰 유형입니다.",
      inner: "속마음은 “사랑이 필요하지만 사랑은 위험하다”에 가깝습니다. 그래서 관계가 안정될수록 긴장이 오르고, 스스로 관계를 흔들어 확인하려는 행동이 나오기도 합니다.",
      style: "썸이 시작되면 텐션이 확 올라가지만, 상대가 마음을 열면 갑자기 거리를 둡니다. 상대는 영문을 모른 채 혼란스러워하고, 본인도 왜 그랬는지 설명하기 어렵습니다.",
      tips: ["감정이 요동칠 때 바로 행동하지 말고 하루를 두고 결정하세요.", "관계를 흔들어 확인하는 대신, “지금 불안해”라고 말로 꺼내 보세요.", "감정 기록이 도움이 됩니다. 언제 올라오고 언제 가라앉는지 알면 덜 휘둘립니다."],
      tags: ["#혼란형", "#감정기복", "#밀당", "#자기이해"],
      best: "안정형",
      bestWhy: "예측 가능한 반응이 불안을 낮춰줍니다.",
      worst: "혼란형",
      worstWhy: "서로의 파도가 겹치면 관계가 계속 흔들립니다.",
      quote: "“가까워지고 싶은데, 무서워.”"
    }
  };

  var quizEl = CT.$("#quiz");
  var resultEl = CT.$("#result");
  var qCount = CT.$("#qCount");
  var qPercent = CT.$("#qPercent");
  var qBar = CT.$("#qBar");
  var qNo = CT.$("#qNo");
  var qTitle = CT.$("#qTitle");
  var qHint = CT.$("#qHint");
  var qOpts = CT.$("#qOpts");
  var prevBtn = CT.$("#prevBtn");

  var idx = 0;
  var answers = new Array(Q.length).fill(null);
  var last = null;

  function render() {
    var q = Q[idx];
    qCount.textContent = (idx + 1) + " / " + Q.length;
    qPercent.textContent = Math.round((idx / Q.length) * 100) + "% 완료";
    qBar.style.width = (idx / Q.length) * 100 + "%";
    qNo.textContent = "Q" + (idx + 1);
    qTitle.textContent = q.q;
    qHint.textContent = q.hint || "";
    qOpts.innerHTML = "";

    q.opts.forEach(function (o, i) {
      var picked = answers[idx] === o.v;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "opt" + (picked ? " is-picked" : "");
      b.innerHTML = '<span class="k">' + "ABCD".charAt(i) + '</span><span class="t">' + CT.esc(o.t) + "</span>";
      b.addEventListener("click", function () { pick(i); });
      qOpts.appendChild(b);
    });

    prevBtn.disabled = idx === 0;
    if (idx === 0) prevBtn.classList.add("hide"); else prevBtn.classList.remove("hide");
  }

  function pick(i) {
    answers[idx] = Q[idx].opts[i].v;
    CT.$$(".opt", qOpts).forEach(function (n) { n.classList.remove("is-picked"); });
    var nodes = CT.$$(".opt", qOpts);
    if (nodes[i]) nodes[i].classList.add("is-picked");

    setTimeout(function () {
      if (idx < Q.length - 1) {
        idx += 1;
        render();
        quizEl.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        finish();
      }
    }, 230);
  }

  function countsFromAnswers() {
    var c = { secure: 0, anxious: 0, avoidant: 0, disorganized: 0 };
    answers.forEach(function (a) { if (a && c[a] !== undefined) c[a] += 1; });
    return c;
  }

  function dominantOf(c) {
    var keys = ["secure", "anxious", "avoidant", "disorganized"];
    var max = Math.max(c.secure, c.anxious, c.avoidant, c.disorganized);
    var tied = keys.filter(function (k) { return c[k] === max; });
    if (tied.length === 1) return tied[0];
    if (tied.indexOf("disorganized") >= 0) return "disorganized";
    if (tied.indexOf("anxious") >= 0) return "anxious";
    if (tied.indexOf("avoidant") >= 0) return "avoidant";
    return "secure";
  }

  function finish() {
    var c = countsFromAnswers();
    showResult(c.secure, c.anxious, c.avoidant, c.disorganized);
  }

  function bar(label, pct, dark) {
    return '<div class="axis">' +
      '<div class="axis-head"><span class="lo">' + label + '</span><span class="mid">' + pct + '%</span></div>' +
      '<div class="axis-track' + (dark ? " on-dark" : "") + '"><i style="width:' + pct + '%"></i></div>' +
    "</div>";
  }

  function showResult(s, a, av, d) {
    var total = s + a + av + d;
    var pct = function (n) { return total ? Math.round((n / total) * 100) : 0; };
    var counts = { secure: s, anxious: a, avoidant: av, disorganized: d };
    var key = dominantOf(counts);
    var t = TYPES[key];
    var anxietyPct = pct(a + d);
    var avoidPct = pct(av + d);

    last = { key: key, type: t, counts: counts, anxietyPct: anxietyPct, avoidPct: avoidPct };

    CT.$("#resHero").innerHTML =
      '<div class="result-hero">' +
        '<span class="r-label">나의 애착유형</span>' +
        '<div class="r-emoji">' + t.emoji + "</div>" +
        "<h2>" + t.name + "</h2>" +
        '<p class="r-sub">' + t.sub + "</p>" +
        '<div class="axes on-dark-text">' +
          bar("불안 애착", anxietyPct, true) +
          bar("회피 애착", avoidPct, true) +
        "</div>" +
      "</div>";

    CT.$("#resBody").innerHTML =
      '<span class="type-badge">' + t.emoji + " " + t.name + "</span>" +
      "<h3>나의 유형 비율</h3>" +
      '<div class="axes" style="margin-top:10px;">' +
        bar("안정형", pct(s)) + bar("불안형", pct(a)) + bar("회피형", pct(av)) + bar("혼란형", pct(d)) +
      "</div>" +
      "<h3>이런 사람이에요</h3><p>" + t.desc + "</p>" +
      "<p>" + t.inner + "</p>" +
      "<h3>썸 스타일</h3><p>" + t.style + "</p>" +
      "<h3>연애 팁</h3><ul>" + t.tips.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>" +
      '<div class="match-grid">' +
        '<div class="match good"><b>잘 맞는 유형</b><span>' + t.best + "</span><small style=\"display:block;margin-top:4px;font-size:11.5px;color:#0b7a47;font-weight:600;\">" + t.bestWhy + "</small></div>" +
        '<div class="match bad"><b>노력이 필요한 조합</b><span>' + t.worst + "</span><small style=\"display:block;margin-top:4px;font-size:11.5px;color:#a15c00;font-weight:600;\">" + t.worstWhy + "</small></div>" +
      "</div>" +
      '<div class="quote">' + t.quote + "<small>이 유형의 속마음에 가까운 문장입니다.</small></div>" +
      '<div class="tag-row">' + t.tags.map(function (x) { return "<span>" + x + "</span>"; }).join("") + "</div>";

    quizEl.classList.add("hide");
    resultEl.classList.remove("hide");
    CT.setHashCode([s, a, av, d].join("-"));
    resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function reset() {
    idx = 0;
    answers = new Array(Q.length).fill(null);
    last = null;
    resultEl.classList.add("hide");
    quizEl.classList.remove("hide");
    try { history.replaceState(null, "", location.pathname); } catch (e) { /* noop */ }
    render();
    quizEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  prevBtn.addEventListener("click", function () {
    if (idx > 0) { idx -= 1; render(); }
  });

  CT.$("#copyResult").addEventListener("click", function () {
    if (!last) return;
    var t = last.type;
    CT.copy(
      "[요즘 테스트] 연애 애착유형 테스트\n" +
      "나의 유형: " + t.emoji + " " + t.name + " (" + t.sub + ")\n" +
      "불안 애착 " + last.anxietyPct + "% · 회피 애착 " + last.avoidPct + "%\n" +
      "너는 뭐 나와: " + CT.resultUrl(Object.keys(last.counts).map(function (k) { return last.counts[k]; }).join("-")),
      "결과를 복사했어요. 연인이나 친구에게 붙여넣기!"
    );
  });

  CT.$("#shareResult").addEventListener("click", function () {
    if (!last) return;
    var t = last.type;
    CT.share({
      title: "연애 애착유형 테스트",
      text: "나의 애착유형은 " + t.emoji + " " + t.name + " — " + t.sub,
      url: CT.resultUrl(Object.keys(last.counts).map(function (k) { return last.counts[k]; }).join("-"))
    });
  });

  CT.$("#retryBtn").addEventListener("click", reset);

  function applyHash() {
    var m = /^(\d)-(\d)-(\d)-(\d)$/.exec(CT.getHashCode() || "");
    if (!m) return false;
    showResult(parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10), parseInt(m[4], 10));
    return true;
  }

  if (!applyHash()) render();
  window.addEventListener("hashchange", function () { applyHash(); });
})();

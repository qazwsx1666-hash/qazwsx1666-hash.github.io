/* ==========================================================================
   1분 초간단 MBTI 테스트 (12문항 · 4축)
   ========================================================================== */
(function () {
  "use strict";

  var QUESTIONS = [
    { q: "주말 계획이 비었다. 나는?", hint: "가장 먼저 드는 생각으로.", axis: "EI", opts: [
      { t: "누구라도 불러서 약속을 잡는다", v: "E", w: 1 },
      { t: "집에서 아무것도 안 하기로 결심한다", v: "I", w: 1 }
    ]},
    { q: "처음 보는 사람이 많은 자리", hint: "문을 열고 들어간 순간.", axis: "EI", opts: [
      { t: "먼저 말을 걸고 분위기를 띄운다", v: "E", w: 3 },
      { t: "아는 사람 옆에 붙어 있는다", v: "I", w: 3 }
    ]},
    { q: "힘든 일이 생겼을 때", hint: "해결보다 먼저 하는 행동.", axis: "EI", opts: [
      { t: "사람을 만나 얘기하며 푼다", v: "E", w: 1 },
      { t: "혼자 정리될 때까지 생각한다", v: "I", w: 1 }
    ]},
    { q: "새 프로젝트 설명을 들으면", hint: "회의실에서 처음 드는 궁금증.", axis: "SN", opts: [
      { t: "구체적으로 뭘 해야 하는지부터 묻는다", v: "S", w: 1 },
      { t: "이게 왜 필요한지 큰 그림부터 본다", v: "N", w: 1 }
    ]},
    { q: "영화를 보고 나서", hint: "친구와 나누는 첫마디.", axis: "SN", opts: [
      { t: "장면과 연출, 디테일이 기억난다", v: "S", w: 3 },
      { t: "결말의 의미와 숨은 메시지를 곱씹는다", v: "N", w: 3 }
    ]},
    { q: "대화할 때 나는", hint: "평소 말하는 방식.", axis: "SN", opts: [
      { t: "사실과 경험을 말한다", v: "S", w: 1 },
      { t: "비유와 상상을 섞는다", v: "N", w: 1 }
    ]},
    { q: "친구가 고민을 털어놓는다", hint: "가장 먼저 나오는 반응.", axis: "TF", opts: [
      { t: "원인을 정리하고 해결책을 알려준다", v: "T", w: 1 },
      { t: "먼저 마음을 알아주고 공감한다", v: "F", w: 1 }
    ]},
    { q: "결정을 내릴 때", hint: "망설이는 순간의 기준.", axis: "TF", opts: [
      { t: "논리와 기준이 먼저", v: "T", w: 3 },
      { t: "사람과 관계가 먼저", v: "F", w: 3 }
    ]},
    { q: "피드백을 해야 할 때", hint: "말 꺼내는 방식.", axis: "TF", opts: [
      { t: "솔직하게 개선점을 말한다", v: "T", w: 1 },
      { t: "상처 주지 않게 좋은 점부터 말한다", v: "F", w: 1 }
    ]},
    { q: "마감이 있는 일", hint: "실제로 일이 굴러가는 방식.", axis: "JP", opts: [
      { t: "미리 끝내둔다", v: "J", w: 1 },
      { t: "마감 직전에 몰입해서 끝낸다", v: "P", w: 1 }
    ]},
    { q: "여행 짐은", hint: "출발 전날의 나.", axis: "JP", opts: [
      { t: "체크리스트를 만들어 미리 싼다", v: "J", w: 3 },
      { t: "출발 전날 밤에 싼다", v: "P", w: 3 }
    ]},
    { q: "약속 시간", hint: "도착 시간 기준으로.", axis: "JP", opts: [
      { t: "10분 전에 도착한다", v: "J", w: 1 },
      { t: "출발하면서 연락한다", v: "P", w: 1 }
    ]}
  ];

  var AXES = [
    { key: "EI", a: "E", b: "I", aLabel: "외향", bLabel: "내향" },
    { key: "SN", a: "S", b: "N", aLabel: "감각", bLabel: "직관" },
    { key: "TF", a: "T", b: "F", aLabel: "사고", bLabel: "감정" },
    { key: "JP", a: "J", b: "P", aLabel: "판단", bLabel: "인식" }
  ];

  var TYPES = {
    ISTJ: { nick: "청렴결백한 논리주의자", emoji: "🗂️", desc: "약속과 절차를 믿습니다. 말보다 결과로 신뢰를 쌓고, 한번 맡은 일은 끝까지 해냅니다. 갑작스러운 변화보다 검증된 방법을 선호합니다.", charm: "조용히 다 해놓는 사람", tip: "변화를 제안할 때는 근거를 함께 주세요.", fit: "ESFP" },
    ISFJ: { nick: "용감한 수호자", emoji: "🛡️", desc: "챙기고 기억하는 능력이 뛰어납니다. 상대가 말하지 않아도 필요한 걸 알아채고, 조용히 준비해 둡니다.", charm: "기억해 주는 사람", tip: "거절을 연습해 보세요. 다 받아주면 지칩니다.", fit: "ESTP" },
    INFJ: { nick: "선의의 옹호자", emoji: "🔮", desc: "사람의 마음을 오래 관찰합니다. 겉으로는 조용하지만 속에는 확고한 기준이 있고, 소수의 사람과 깊게 연결됩니다.", charm: "한 사람을 깊이 이해하는 사람", tip: "생각을 말로 꺼내세요. 안에만 두면 오해받습니다.", fit: "ENFP" },
    INTJ: { nick: "용의주도한 전략가", emoji: "♟️", desc: "목표가 정해지면 계획을 끝까지 밀어붙입니다. 감정보다 구조와 효율로 판단하고, 혼자서 판을 짜는 걸 즐깁니다.", charm: "혼자서 판을 짜는 사람", tip: "결론 전에 상대의 감정을 한 번 짚어주세요.", fit: "ENFP" },
    ISTP: { nick: "만능 재주꾼", emoji: "🔧", desc: "말없이 손으로 해결합니다. 문제가 생기면 일단 뜯어보고 고칩니다. 설명보다 결과물로 말하는 편입니다.", charm: "고장 난 건 일단 뜯어보는 사람", tip: "필요한 말은 먼저 하세요. 침묵은 차갑게 보입니다.", fit: "ESFJ" },
    ISFP: { nick: "호기심 많은 예술가", emoji: "🎨", desc: "분위기와 감각에 민감합니다. 자기만의 취향과 속도가 분명하고, 억지로 맞추는 걸 힘들어합니다.", charm: "조용히 자기 색을 지키는 사람", tip: "원하는 걸 말해 보세요. 기다리는 것만으로는 전달되지 않습니다.", fit: "ENFJ" },
    INFP: { nick: "열정적인 중재자", emoji: "🌱", desc: "이상과 감정이 깊습니다. 겉으로는 순해 보여도 신념은 쉽게 꺾이지 않고, 사람 사이의 진심을 중요하게 봅니다.", charm: "마음속에 세계가 있는 사람", tip: "완벽한 때를 기다리지 말고 지금 시작하세요.", fit: "ENFJ" },
    INTP: { nick: "논리적인 사색가", emoji: "🧩", desc: "왜 그런지가 궁금합니다. 답보다 질문을 오래 붙잡고, 논리로 파고들다 보면 시간이 훅 갑니다.", charm: "질문이 멈추지 않는 사람", tip: "설명을 조금만 줄이고 결론부터 말해 보세요.", fit: "ESFJ" },
    ESTP: { nick: "모험을 즐기는 사업가", emoji: "🏄", desc: "일단 부딪혀 봅니다. 상황이 급할수록 판단이 빨라지고, 현장에서 배우는 걸 좋아합니다.", charm: "눈치보다 몸이 먼저 나가는 사람", tip: "지름길만 고집하면 동료가 지칩니다.", fit: "ISFJ" },
    ESFP: { nick: "자유로운 영혼의 연예인", emoji: "🎤", desc: "지금 이 순간을 즐깁니다. 사람과 분위기를 살리는 에너지가 크고, 어디서든 금세 친해집니다.", charm: "어디서든 분위기 메이커", tip: "오늘의 즐거움과 내일의 계획을 함께 챙기세요.", fit: "ISTJ" },
    ENFP: { nick: "재기발랄한 활동가", emoji: "✨", desc: "새로운 가능성에 불이 붙습니다. 사람에게 관심이 많고 아이디어가 끊기지 않아서, 대화가 시작되면 시간이 빨리 갑니다.", charm: "오늘도 새로 시작하는 사람", tip: "벌인 일을 마무리하는 사람을 곁에 두세요.", fit: "INFJ" },
    ENTP: { nick: "뜨거운 논쟁을 즐기는 변론가", emoji: "💬", desc: "반박하며 사고를 키웁니다. 규칙보다 더 나은 방법을 찾는 걸 즐기고, 토론이 끝나면 금방 잊습니다.", charm: "일단 반박하고 보는 사람", tip: "반박하기 전에 한 번 더 들어주세요.", fit: "ISFJ" },
    ESTJ: { nick: "엄격한 관리자", emoji: "📋", desc: "정리와 실행이 빠릅니다. 해야 할 일을 나누고 끝까지 확인하며, 애매한 상태를 오래 두지 못합니다.", charm: "일단 표를 만드는 사람", tip: "효율보다 사람의 속도를 존중해 주세요.", fit: "ISFP" },
    ESFJ: { nick: "사교적인 외교관", emoji: "🤝", desc: "관계를 챙기는 게 본능입니다. 모임의 분위기와 디테일을 기억하고, 모두가 편하도록 먼저 움직입니다.", charm: "빠지면 아쉬운 사람", tip: "모두를 챙기다 지치면 내 마음부터 챙기세요.", fit: "ISTP" },
    ENFJ: { nick: "정의로운 사회운동가", emoji: "📣", desc: "사람의 가능성을 끌어올립니다. 듣다가 결국 같이 해결책을 찾고, 누군가의 성장을 자기 일처럼 기뻐합니다.", charm: "사람을 움직이는 사람", tip: "상대를 위해 결정하지 말고 물어보세요.", fit: "ISFP" },
    ENTJ: { nick: "대담한 통솔자", emoji: "👑", desc: "결론을 내고 길을 엽니다. 망설임보다 실행이 먼저이고, 목표가 생기면 자원과 사람을 어떻게 쓸지부터 생각합니다.", charm: "일단 목표부터 정하는 사람", tip: "속도를 낮추면 더 멀리 갑니다.", fit: "INFP" }
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
  var answers = new Array(QUESTIONS.length).fill(null);
  var last = null;

  function render() {
    var q = QUESTIONS[idx];
    qCount.textContent = (idx + 1) + " / " + QUESTIONS.length;
    qPercent.textContent = Math.round((idx / QUESTIONS.length) * 100) + "% 완료";
    qBar.style.width = (idx / QUESTIONS.length) * 100 + "%";
    qNo.textContent = "Q" + (idx + 1);
    qTitle.textContent = q.q;
    qHint.textContent = q.hint || "";
    qOpts.innerHTML = "";

    q.opts.forEach(function (o, i) {
      var picked = answers[idx] && answers[idx].v === o.v;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "opt" + (picked ? " is-picked" : "");
      b.innerHTML = '<span class="k">' + (i === 0 ? "A" : "B") + '</span><span class="t">' + CT.esc(o.t) + "</span>";
      b.addEventListener("click", function () { pick(i); });
      qOpts.appendChild(b);
    });

    prevBtn.disabled = idx === 0;
    if (idx === 0) prevBtn.classList.add("hide"); else prevBtn.classList.remove("hide");
  }

  function pick(i) {
    answers[idx] = QUESTIONS[idx].opts[i];
    CT.$$(".opt", qOpts).forEach(function (n) { n.classList.remove("is-picked"); });
    var nodes = CT.$$(".opt", qOpts);
    if (nodes[i]) nodes[i].classList.add("is-picked");

    setTimeout(function () {
      if (idx < QUESTIONS.length - 1) {
        idx += 1;
        render();
        quizEl.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        finish();
      }
    }, 230);
  }

  function compute() {
    var sums = { EI: 0, SN: 0, TF: 0, JP: 0 };
    var totals = { EI: 0, SN: 0, TF: 0, JP: 0 };
    QUESTIONS.forEach(function (q, i) {
      totals[q.axis] += q.opts[0].w;
      var a = answers[i];
      if (!a) return;
      var ax = AXES.filter(function (x) { return x.key === q.axis; })[0];
      if (a.v === ax.a) sums[q.axis] += a.w;
    });
    var pcts = {};
    var code = "";
    AXES.forEach(function (ax) {
      var p = totals[ax.key] ? Math.round((sums[ax.key] / totals[ax.key]) * 100) : 50;
      pcts[ax.key] = p;
      code += p >= 60 ? ax.a : ax.b;
    });
    return { code: code, pcts: pcts };
  }

  function axisRow(ax, pct) {
    return '<div class="axis">' +
      '<div class="axis-head"><span class="lo">' + ax.aLabel + '</span><span class="mid">' + ax.aLabel + " " + pct + '%</span><span class="hi">' + ax.bLabel + '</span></div>' +
      '<div class="axis-track on-dark"><i style="width:' + pct + '%"></i></div>' +
      '<div class="axis-note"><span>' + pct + "%</span><span>" + (100 - pct) + "%</span></div>" +
    "</div>";
  }

  function showResult(code, pcts) {
    var t = TYPES[code];
    if (!t) { render(); return; }
    last = { code: code, type: t, pcts: pcts };

    var heroAxes = AXES.map(function (ax) { return axisRow(ax, pcts[ax.key]); }).join("");

    CT.$("#resHero").innerHTML =
      '<div class="result-hero">' +
        '<span class="r-label">나의 MBTI 유형</span>' +
        '<div class="r-emoji">' + t.emoji + "</div>" +
        "<h2>" + code + "</h2>" +
        '<p class="r-sub">' + t.nick + "</p>" +
        '<div class="axes on-dark-text">' + heroAxes + "</div>" +
      "</div>";

    var others = Object.keys(TYPES).map(function (k) {
      return '<div class="mbti-cell' + (k === code ? " is-mine" : "") + '">' + k + "</div>";
    }).join("");

    var tagRow = AXES.map(function (ax) {
      var letter = pcts[ax.key] >= 60 ? ax.a : ax.b;
      var label = pcts[ax.key] >= 60 ? ax.aLabel : ax.bLabel;
      var val = pcts[ax.key] >= 60 ? pcts[ax.key] : 100 - pcts[ax.key];
      return "<span>" + label + " " + val + "%</span>";
    }).join("");

    CT.$("#resBody").innerHTML =
      '<span class="type-badge">' + t.emoji + " " + code + " · " + t.nick + "</span>" +
      "<h3>이런 사람이에요</h3><p>" + t.desc + "</p>" +
      '<div class="quote">“' + t.charm + '”<small>한 줄로 표현한 ' + code + "</small></div>" +
      "<h3>관계 팁</h3><p>" + t.tip + "</p>" +
      '<div class="match-grid">' +
        '<div class="match good"><b>찰떡 궁합</b><span>' + t.fit + " · " + TYPES[t.fit].nick + '</span><small style="display:block;margin-top:4px;font-size:11.5px;color:#0b7a47;font-weight:600;">서로의 빈 곳을 채워주는 조합</small></div>' +
        '<div class="match bad"><b>노력이 필요한 조합</b><span>같은 ' + code + '끼리</span><small style="display:block;margin-top:4px;font-size:11.5px;color:#a15c00;font-weight:600;">서로를 너무 잘 알아서 고집이 부딪힙니다</small></div>' +
      "</div>" +
      '<div class="tag-row">' + tagRow + "</div>" +
      "<h3>16유형 중 내 자리</h3>" +
      '<div class="mbti-grid">' + others + "</div>";

    quizEl.classList.add("hide");
    resultEl.classList.remove("hide");
    var p = AXES.map(function (ax) { return pcts[ax.key]; });
    CT.setHashCode(code + "-" + p.join("-"));
    resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function finish() {
    var r = compute();
    showResult(r.code, r.pcts);
  }

  function reset() {
    idx = 0;
    answers = new Array(QUESTIONS.length).fill(null);
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
    var p = AXES.map(function (ax) { return last.pcts[ax.key]; });
    CT.copy(
      "[요즘 테스트] 1분 초간단 MBTI\n" +
      "나의 유형: " + t.emoji + " " + last.code + " · " + t.nick + "\n" +
      "외향 " + p[0] + "% · 감각 " + p[1] + "% · 사고 " + p[2] + "% · 판단 " + p[3] + "%\n" +
      "너는? " + CT.resultUrl(last.code + "-" + p.join("-")),
      "결과를 복사했어요. 친구에게 붙여넣기!"
    );
  });

  CT.$("#shareResult").addEventListener("click", function () {
    if (!last) return;
    var t = last.type;
    var p = AXES.map(function (ax) { return last.pcts[ax.key]; });
    CT.share({
      title: "1분 초간단 MBTI 테스트",
      text: "내 MBTI는 " + last.code + " · " + t.nick + " " + t.emoji,
      url: CT.resultUrl(last.code + "-" + p.join("-"))
    });
  });

  CT.$("#retryBtn").addEventListener("click", reset);

  function applyHash() {
    var m = /^([EI][SN][TF][JP])(?:-(\d{1,3})-(\d{1,3})-(\d{1,3})-(\d{1,3}))?$/.exec(CT.getHashCode() || "");
    if (!m) return false;
    var raw = m[1];
    var pcts = {
      EI: Math.max(0, Math.min(100, m[2] ? parseInt(m[2], 10) : (raw.charAt(0) === "E" ? 80 : 20))),
      SN: Math.max(0, Math.min(100, m[3] ? parseInt(m[3], 10) : (raw.charAt(1) === "S" ? 80 : 20))),
      TF: Math.max(0, Math.min(100, m[4] ? parseInt(m[4], 10) : (raw.charAt(2) === "T" ? 80 : 20))),
      JP: Math.max(0, Math.min(100, m[5] ? parseInt(m[5], 10) : (raw.charAt(3) === "J" ? 80 : 20)))
    };
    var type = (pcts.EI >= 60 ? "E" : "I") + (pcts.SN >= 60 ? "S" : "N") +
               (pcts.TF >= 60 ? "T" : "F") + (pcts.JP >= 60 ? "J" : "P");
    showResult(TYPES[type] ? type : raw, pcts);
    return true;
  }

  if (!applyHash()) render();
  window.addEventListener("hashchange", function () { applyHash(); });
})();

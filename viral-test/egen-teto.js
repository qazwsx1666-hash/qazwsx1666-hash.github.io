/* ==========================================================================
   에겐·테토 성향 테스트
   ========================================================================== */
(function () {
  "use strict";

  var QUESTIONS = [
    {
      q: "단톡방에 웃긴 짤이 올라왔다. 나는?",
      hint: "손이 먼저 가는 쪽을 고르세요.",
      opts: [
        { t: "“ㅋㅋㅋㅋㅋ” 다섯 번 치고 더 웃긴 짤로 받아친다", v: "E" },
        { t: "“ㅋ” 한 번 치고 하던 일 마저 한다", v: "T" }
      ]
    },
    {
      q: "카페에서 주문할 때 나는?",
      hint: "말투와 눈맞춤을 떠올려 보세요.",
      opts: [
        { t: "“아이스 아메리카노 한 잔 주세요~” 또박또박, 눈 맞추며", v: "E" },
        { t: "“아아 하나요.” 짧고 빠르게 끝낸다", v: "T" }
      ]
    },
    {
      q: "어제 다툰 사람과 오늘 마주쳤다.",
      hint: "먼저 나오는 행동으로 골라주세요.",
      opts: [
        { t: "먼저 다가가 “우리 얘기 좀 하자” 손을 내민다", v: "E" },
        { t: "시간이 약이다. 평소처럼 쿨하게 대한다", v: "T" }
      ]
    },
    {
      q: "옷장 문을 열면 더 많은 쪽은?",
      hint: "오늘 입고 싶은 옷 기준으로.",
      opts: [
        { t: "파스텔·니트·포근한 핏", v: "E" },
        { t: "블랙·가죽·각 잡힌 핏", v: "T" }
      ]
    },
    {
      q: "무거운 짐을 앞에 두고 나는?",
      hint: "말이 먼저인지 손이 먼저인지.",
      opts: [
        { t: "“내가 들게!” 손이 먼저 나간다", v: "E" },
        { t: "“같이 들자. 어디로 옮길까?” 방법부터 정한다", v: "T" }
      ]
    },
    {
      q: "영화 한 편을 고른다면?",
      hint: "리모컨을 잡았을 때 기준.",
      opts: [
        { t: "로코·감성·눈물 한 스푼", v: "E" },
        { t: "액션·스릴러·범죄 스릴", v: "T" }
      ]
    },
    {
      q: "친구가 “나 요즘 힘들어”라고 한다.",
      hint: "제일 먼저 하는 말이나 행동.",
      opts: [
        { t: "일단 안아주고 끝까지 들어준다", v: "E" },
        { t: "원인을 같이 정리하고 해결책을 찾는다", v: "T" }
      ]
    },
    {
      q: "사진 찍을 때 나오는 포즈는?",
      hint: "친구가 카메라를 들었을 때.",
      opts: [
        { t: "손하트, 볼 하트, 윙크", v: "E" },
        { t: "무표정, 턱 괴기, 각도 승부", v: "T" }
      ]
    },
    {
      q: "선물을 고를 때 나는?",
      hint: "지난번 선물을 떠올려 보세요.",
      opts: [
        { t: "손편지와 감성 소품을 고른다", v: "E" },
        { t: "실용템을 찾아 비교 후기를 세 시간 본다", v: "T" }
      ]
    },
    {
      q: "내 말투에 더 가까운 것은?",
      hint: "카톡으로 답장할 때를 생각해 보세요.",
      opts: [
        { t: "“~해요~”, “~잖아요” 부드러운 말투", v: "E" },
        { t: "“~함”, “~임” 짧고 단호한 말투", v: "T" }
      ]
    }
  ];

  var TYPES = {
    egen90: {
      band: "에겐 80~100%",
      name: "에겐 그 자체",
      sub: "설렘 요정 · 다정함이 기본값",
      emoji: "🌸",
      desc: "당신은 공간의 온도를 먼저 읽는 사람입니다. 말투가 부드럽고 표정이 잘 드러나서, 옆에 있는 것만으로도 분위기가 풀립니다. 누군가 힘들어 보이면 이유를 묻기 전에 물 한 잔부터 건네죠.",
      love: "애정 표현이 자연스러운 편입니다. 손잡기, 안아주기, 예쁜 말 한마디를 아끼지 않아서 상대가 안정감을 느낍니다. 다만 상대가 무뚝뚝하면 ‘나만 좋아하나’ 싶어 혼자 속상해하기도 합니다.",
      tips: ["좋아한다는 말을 아끼지 마세요. 상대는 그 말로 하루를 버팁니다.", "상대의 무뚝뚝함을 ‘마음이 없는 것’으로 해석하지 않기.", "챙기다가 지칠 때는 “나도 좀 안아줘”라고 말해도 괜찮아요."],
      tags: ["#다정함", "#공감요정", "#분위기메이커", "#표현부자"],
      best: "테토 그 자체 · 츤데레 대장",
      bestWhy: "표현은 당신이, 행동은 상대가 채워줍니다.",
      worst: "에겐 그 자체",
      worstWhy: "둘 다 눈치만 보다가 속마음을 못 꺼냅니다.",
      quote: "“괜찮아?” 이 한마디를 먼저 건네는 사람."
    },
    egen70: {
      band: "에겐 60~70%",
      name: "에겐 우세",
      sub: "다정한 츤데레",
      emoji: "🌷",
      desc: "평소에는 다정하지만 선은 확실한 사람입니다. 챙겨주다가도 상대가 선을 넘으면 단호하게 말합니다. 그래서 ‘무섭지 않은데 무서운 사람’이라는 말을 자주 듣습니다.",
      love: "좋아할수록 티를 안 내려고 합니다. 표현은 하는데 부끄러워서 장난으로 덮어버리죠. 상대가 눈치를 못 채면 혼자 삭히는 경우가 많으니, 한 번은 진지하게 말해보는 게 좋습니다.",
      tips: ["장난으로 덮은 진심을 한 번은 그대로 꺼내 보세요.", "서운한 건 웃으면서 넘기지 말고 짧게라도 말하기.", "상대가 다정하게 굴면 받아들이는 연습을."],
      tags: ["#츤데레", "#선은확실", "#다정함", "#밀당반반"],
      best: "테토 그 자체 · 츤데레 대장",
      bestWhy: "당신이 말로, 상대가 행동으로 애정을 표현합니다.",
      worst: "반반 밸런스",
      worstWhy: "서로 눈치만 보다가 밀당 피로감이 쌓입니다.",
      quote: "“싫다는 거야, 좋다는 거야?”를 듣는 사람."
    },
    egen50: {
      band: "에겐 40~50%",
      name: "반반 밸런스",
      sub: "밀당 장인 · 상황 맞춤형",
      emoji: "⚖️",
      desc: "상대와 상황에 따라 에겐도 테토도 되는 사람입니다. 회사에서는 테토, 연인 앞에서는 에겐인 경우가 많습니다. 적응력이 좋고 눈치가 빨라서 어디서든 무난하게 어울립니다.",
      love: "상대의 텐션을 읽고 맞춰주는 능력이 좋습니다. 다만 본모습을 잘 보여주지 않아 ‘속을 모르겠다’는 말을 듣기도 합니다. 좋아하는 사람에게만은 계산을 조금 내려놓아 보세요.",
      tips: ["맞춰주는 것과 참는 것은 다릅니다. 원하는 걸 말해 보세요.", "상대가 헷갈리지 않게 신호를 한 번은 분명히.", "혼자 있을 때의 취향도 관계에 조금씩 꺼내 보기."],
      tags: ["#상황맞춤", "#눈치빠름", "#밀당장인", "#적응력"],
      best: "반반 밸런스",
      bestWhy: "서로의 눈치를 이해해서 편안합니다.",
      worst: "테토 그 자체",
      worstWhy: "당신의 신호를 읽지 못해 답답해질 수 있어요.",
      quote: "“너 원래 이런 사람이야?”라는 말을 듣는 사람."
    },
    egen30: {
      band: "에겐 20~30%",
      name: "테토 우세",
      sub: "무뚝뚝 직진러",
      emoji: "🔥",
      desc: "말보다 행동이 먼저인 사람입니다. 좋아하면 직진하고 싫으면 선을 긋습니다. 감정 표현은 서툴지만, 뒤에서 조용히 다 챙겨놓는 쪽입니다.",
      love: "고백도 계획적으로, 데이트도 동선까지 정해놓습니다. 상대는 무뚝뚝함에 서운해할 수 있지만, 힘들 때 실질적으로 도와주는 건 당신입니다. 말 한마디만 더하면 완벽한데, 그게 어렵죠.",
      tips: ["“고마워”, “예뻐” 한마디는 무뚝뚝함을 깨지 않습니다.", "서운한 상대에게는 결론보다 과정을 설명해 주세요.", "행동으로 챙겼다면 말로도 한 번 알려주기."],
      tags: ["#직진", "#행동파", "#무뚝뚝", "#뒤에서챙김"],
      best: "에겐 그 자체 · 설렘 요정",
      bestWhy: "당신의 행동에 상대의 표현이 더해집니다.",
      worst: "테토 그 자체",
      worstWhy: "둘 다 표현을 안 해서 감정이 증발합니다.",
      quote: "“말은 안 하는데 다 해놓는” 사람."
    },
    egen10: {
      band: "에겐 0~10%",
      name: "테토 그 자체",
      sub: "츤데레 대장 · 결론부터",
      emoji: "🐺",
      desc: "감정보다 결론이 먼저인 사람입니다. “그래서 어떻게 할 건데”가 입버릇처럼 나옵니다. 무뚝뚝하지만 약속은 지키고, 필요한 건 미리 준비해 둡니다.",
      love: "좋아한다는 말은 잘 못 하지만, 상대의 일정과 취향은 다 외우고 있습니다. 표현이 없어서 오해받기 쉬운 유형이라, 가끔은 입을 열어야 마음이 전달됩니다.",
      tips: ["문자라도 좋으니 하루에 한 번 마음을 말로 꺼내기.", "상대가 감정을 말할 때는 해결보다 공감이 먼저.", "무뚝뚝한 게 매력인 사람도 있으니, 굳이 바꾸지 않아도 됩니다."],
      tags: ["#결론부터", "#츤데레", "#행동파", "#무뚝뚝"],
      best: "에겐 그 자체 · 설렘 요정",
      bestWhy: "상대가 표현을 채워주고, 당신이 안정감을 줍니다.",
      worst: "테토 그 자체",
      worstWhy: "서로 말이 없어 관계가 조용히 식습니다.",
      quote: "“어? 이거 왜 이렇게 해놨어…”라고 중얼거리며 다 해놓는 사람."
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
  var copyBtn = CT.$("#copyResult");
  var shareBtn = CT.$("#shareResult");
  var retryBtn = CT.$("#retryBtn");

  var idx = 0;
  var answers = new Array(QUESTIONS.length).fill(null);
  var lastType = null;

  function bandOf(egenPct) {
    if (egenPct >= 80) return "egen90";
    if (egenPct >= 60) return "egen70";
    if (egenPct >= 40) return "egen50";
    if (egenPct >= 20) return "egen30";
    return "egen10";
  }

  function render() {
    var q = QUESTIONS[idx];
    var total = QUESTIONS.length;
    qCount.textContent = (idx + 1) + " / " + total;
    qPercent.textContent = Math.round(((idx) / total) * 100) + "% 완료";
    qBar.style.width = (idx / total) * 100 + "%";
    qNo.textContent = "Q" + (idx + 1);
    qTitle.textContent = q.q;
    qHint.textContent = q.hint || "";
    qOpts.innerHTML = "";

    q.opts.forEach(function (o, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "opt" + (answers[idx] === o.v && answers[idx] !== null ? " is-picked" : "");
      b.innerHTML = '<span class="k">' + (i === 0 ? "A" : "B") + '</span><span class="t">' + CT.esc(o.t) + "</span>";
      b.addEventListener("click", function () { pick(i); });
      qOpts.appendChild(b);
    });

    prevBtn.disabled = idx === 0;
    if (idx === 0) prevBtn.classList.add("hide"); else prevBtn.classList.remove("hide");
  }

  function pick(i) {
    var q = QUESTIONS[idx];
    answers[idx] = q.opts[i].v;
    var nodes = CT.$$(".opt", qOpts);
    nodes.forEach(function (n) { n.classList.remove("is-picked"); });
    if (nodes[i]) nodes[i].classList.add("is-picked");

    setTimeout(function () {
      if (idx < QUESTIONS.length - 1) {
        idx += 1;
        render();
        quizEl.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        showResult();
      }
    }, 230);
  }

  function showResult(code) {
    var egenCount, ttCount, egenPct;
    if (code) {
      egenPct = Math.max(0, Math.min(100, parseInt(code, 10) || 0));
      egenCount = Math.round(egenPct / 10);
      ttCount = QUESTIONS.length - egenCount;
      egenPct = egenCount * 10;
    } else {
      egenCount = answers.filter(function (a) { return a === "E"; }).length;
      ttCount = QUESTIONS.length - egenCount;
      egenPct = egenCount * 10;
    }

    var t = TYPES[bandOf(egenPct)];
    lastType = { type: t, egenPct: egenPct, egenCount: egenCount, ttCount: ttCount };

    CT.$("#resHero").innerHTML =
      '<div class="result-hero">' +
        '<span class="r-label">나의 에겐·테토 결과</span>' +
        '<div class="r-emoji">' + t.emoji + "</div>" +
        "<h2>에겐 " + egenPct + "% · 테토 " + (100 - egenPct) + "%</h2>" +
        '<p class="r-sub">' + t.name + " · " + t.sub + "</p>" +
        '<div class="axes on-dark-text">' +
          '<div class="axis">' +
            '<div class="axis-head"><span class="lo">에겐</span><span class="mid"></span><span class="hi">테토</span></div>' +
            '<div class="axis-track on-dark"><i style="width:' + egenPct + '%"></i></div>' +
            '<div class="axis-note"><span>에겐 ' + egenCount + "개</span><span>테토 " + ttCount + "개</span></div>" +
          "</div>" +
        "</div>" +
      "</div>";

    CT.$("#resBody").innerHTML =
      '<span class="type-badge">' + t.emoji + " " + t.name + "</span>" +
      "<h3>이런 사람이에요</h3><p>" + t.desc + "</p>" +
      "<h3>연애·썸에서는</h3><p>" + t.love + "</p>" +
      "<h3>이렇게 하면 더 좋아요</h3><ul>" + t.tips.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>" +
      '<div class="match-grid">' +
        '<div class="match good"><b>찰떡 궁합</b><span>' + t.best + "</span><small style=\"display:block;margin-top:4px;font-size:11.5px;color:#0b7a47;font-weight:600;\">" + t.bestWhy + "</small></div>" +
        '<div class="match bad"><b>상극 궁합</b><span>' + t.worst + "</span><small style=\"display:block;margin-top:4px;font-size:11.5px;color:#a15c00;font-weight:600;\">" + t.worstWhy + "</small></div>" +
      "</div>" +
      '<div class="quote">' + t.quote + "<small>결과 카드에 이런 문장이 어울립니다.</small></div>" +
      '<div class="tag-row">' + t.tags.map(function (x) { return "<span>" + x + "</span>"; }).join("") + "</div>";

    quizEl.classList.add("hide");
    resultEl.classList.remove("hide");
    CT.setHashCode("e" + egenPct);
    resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function reset() {
    idx = 0;
    answers = new Array(QUESTIONS.length).fill(null);
    lastType = null;
    resultEl.classList.add("hide");
    quizEl.classList.remove("hide");
    try { history.replaceState(null, "", location.pathname); } catch (e) { /* noop */ }
    render();
    quizEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  prevBtn.addEventListener("click", function () {
    if (idx > 0) {
      idx -= 1;
      render();
    }
  });

  copyBtn.addEventListener("click", function () {
    if (!lastType) return;
    var t = lastType.type;
    var text =
      "[요즘 테스트] 에겐·테토 성향 테스트\n" +
      "나의 결과: 에겐 " + lastType.egenPct + "% · 테토 " + (100 - lastType.egenPct) + "%\n" +
      t.emoji + " " + t.name + " (" + t.sub + ")\n" +
      "너도 해봐: " + CT.resultUrl("e" + lastType.egenPct);
    CT.copy(text, "결과를 복사했어요. 단톡방에 붙여넣기!");
  });

  shareBtn.addEventListener("click", function () {
    if (!lastType) return;
    var t = lastType.type;
    CT.share({
      title: "에겐·테토 성향 테스트",
      text: "나는 에겐 " + lastType.egenPct + "% · 테토 " + (100 - lastType.egenPct) + "% — " + t.name + " (" + t.sub + ")",
      url: CT.resultUrl("e" + lastType.egenPct)
    });
  });

  retryBtn.addEventListener("click", reset);

  /* 공유 링크로 들어온 경우 결과 바로 보기 */
  function applyHash() {
    var code = CT.getHashCode();
    if (/^e\d{1,3}$/.test(code)) {
      var p = Math.max(0, Math.min(100, parseInt(code.slice(1), 10)));
      showResult(String(Math.round(p / 10) * 10));
      return true;
    }
    return false;
  }

  if (!applyHash()) render();
  window.addEventListener("hashchange", function () { applyHash(); });
})();

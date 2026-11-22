/* ==========================================================================
   직장인 생존 유형 테스트 (SBTI)
   축: 관계(사교 S / 혼자 A) · 일 처리(계획 P / 즉흥 I) · 퇴근(칼퇴 K / 야근 Y)
   ========================================================================== */
(function () {
  "use strict";

  var QUESTIONS = [
    {
      q: "회의 시간, 나는?",
      hint: "회의실에 앉았을 때의 나를 떠올려 보세요.",
      opts: [
        { t: "의견은 한 번은 꼭 말한다. 진행도 자연스럽게 맡는다", axis: "rel", v: "S", w: 1 },
        { t: "결론만 들으면 된다. 고개만 끄덕인다", axis: "rel", v: "A", w: 1 }
      ]
    },
    {
      q: "마감이 3일 남았다. 나는?",
      hint: "가장 현실적인 행동으로 골라주세요.",
      opts: [
        { t: "할 일 목록과 일정표부터 만든다", axis: "work", v: "P", w: 1 },
        { t: "일단 오늘은 커피부터. 내일의 나를 믿는다", axis: "work", v: "I", w: 1 }
      ]
    },
    {
      q: "6시 정각, 나는?",
      hint: "퇴근 시간의 손이 먼저 움직이는 쪽.",
      opts: [
        { t: "가방은 이미 어깨에. 인사하고 나간다", axis: "off", v: "K", w: 1 },
        { t: "“지금 이거만 끝내고…” 하다가 30분이 지난다", axis: "off", v: "Y", w: 1 }
      ]
    },
    {
      q: "점심시간, 나는?",
      hint: "12시 종이 울렸을 때.",
      opts: [
        { t: "누구랑 먹을지부터 정한다. 단체가 좋다", axis: "rel", v: "S", w: 1 },
        { t: "혼밥 자리부터 찾는다. 조용히 먹고 싶다", axis: "rel", v: "A", w: 1 }
      ]
    },
    {
      q: "새 업무가 갑자기 떨어졌다.",
      hint: "책상에 앉아 처음 하는 행동.",
      opts: [
        { t: "기존 일정을 조정하고 우선순위를 다시 짠다", axis: "work", v: "P", w: 1 },
        { t: "일단 벌여놓고 하다 보면 되지, 하고 손부터 댄다", axis: "work", v: "I", w: 1 }
      ]
    },
    {
      q: "퇴근 직전, 상사가 “이것만”이라고 한다.",
      hint: "실제로 나오는 대답으로.",
      opts: [
        { t: "“내일 아침 첫 번째로 하겠습니다”", axis: "off", v: "K", w: 1 },
        { t: "“네, 지금 할게요.” 앉는다", axis: "off", v: "Y", w: 1 }
      ]
    },
    {
      q: "회식이 잡혔다. 나는?",
      hint: "가장 솔직한 마음으로.",
      opts: [
        { t: "1차는 무조건 간다. 분위기 띄우는 건 나", axis: "rel", v: "S", w: 2 },
        { t: "1차만 살짝, 2차는 조용히 귀가한다", axis: "rel", v: "A", w: 2 }
      ]
    },
    {
      q: "업무를 보고할 때 나는?",
      hint: "메신저나 메일로 정리하는 방식을 떠올려 보세요.",
      opts: [
        { t: "요약 → 근거 → 요청 순서로 정리해서 보낸다", axis: "work", v: "P", w: 1 },
        { t: "일단 말로 하고, 물어보면 그때 정리한다", axis: "work", v: "I", w: 1 }
      ]
    },
    {
      q: "연차를 쓸 때 나는?",
      hint: "쉬고 싶은 날의 행동.",
      opts: [
        { t: "당일 아침에 바로 신청한다", axis: "off", v: "K", w: 1 },
        { t: "업무 정리하고 눈치 보다가 결국 못 쓴다", axis: "off", v: "Y", w: 1 }
      ]
    },
    {
      q: "신입이 업무를 물어본다.",
      hint: "가장 자연스러운 반응.",
      opts: [
        { t: "“내 자리로 와서 같이 보자”", axis: "rel", v: "S", w: 1 },
        { t: "정리해서 메일로 보내준다. 그게 편하다", axis: "rel", v: "A", w: 1 }
      ]
    }
  ];

  var TYPES = {
    SPK: {
      name: "회의실 지배자",
      sub: "말로 판을 짜고 정시에 퇴근",
      emoji: "🗣️",
      desc: "회의가 시작되면 자연스럽게 진행을 맡습니다. “그럼 이렇게 정리하죠”로 결론을 내고, 할 일을 나눠 적어 메일까지 보냅니다. 일이 많아도 우선순위를 잘 세워서 정시 퇴근이 가능한 유형입니다.",
      day: "오전 회의에서 안건을 정리하고, 오후엔 나눠준 일이 굴러가는지 확인합니다. 6시 땡 치면 노트북을 닫고, 팀원들이 “저 사람 언제 다 했지”라고 말합니다.",
      tips: ["회의가 길어지면 “결론부터 말씀드리면”으로 끊어 주세요.", "동료 의견을 한 번 더 물으면 독재자가 아니라 리더로 보입니다.", "회의록은 한 줄 요약과 담당자만 남겨도 충분합니다."],
      tags: ["#회의장악", "#정리왕", "#칼퇴", "#리더형"],
      best: "칼퇴요정",
      bestWhy: "당신이 판을 짜고, 상대가 조용히 실행합니다.",
      worst: "무한지연형",
      worstWhy: "정리해준 일정이 마감 직전에 몰려옵니다.",
      quote: "“그럼 이렇게 정리하죠.”"
    },
    SPY: {
      name: "갓생 과몰입러",
      sub: "계획·소통·야근까지 다 하는 엔진",
      emoji: "🚀",
      desc: "아침엔 운동, 낮엔 회의, 밤엔 마감. 스스로에게 기대치가 높아 “이거까지 할게요”가 입버릇입니다. 팀에서 없으면 안 되는 사람이지만, 그만큼 번아웃 위험도 가장 큰 유형입니다.",
      day: "할 일 목록을 다섯 개씩 지우면서도 새 일을 두 개씩 추가합니다. 야근을 밥 먹듯 하지만 “괜찮아요”라고 말합니다.",
      tips: ["오늘 꼭 해야 할 일 3개만 남기고 나머지는 내일로 넘기세요.", "“안 해도 되는 일”을 구분하는 게 진짜 실력입니다.", "야근한 날은 다음 날 아침을 비워두세요. 회복도 업무입니다."],
      tags: ["#갓생", "#과몰입", "#책임감", "#번아웃주의"],
      best: "눈치 백단형",
      bestWhy: "옆에서 “그건 안 해도 돼요”라고 말려줍니다.",
      worst: "월급루팡 마스터",
      worstWhy: "당신이 떠안은 일이 상대에게는 남의 일입니다.",
      quote: "“저 이거까지 할게요.”"
    },
    SIK: {
      name: "월급루팡 마스터",
      sub: "수다와 눈치로 하루를 버티고 칼퇴",
      emoji: "☕",
      desc: "커피 타임, 점심 메뉴 토론, 탕비실 인사까지 회사의 사교를 담당합니다. 일은 요령 있게 처리하고 6시엔 사라지지만, 위기 때 은근히 도와주는 의외성이 있습니다.",
      day: "오전엔 커피와 함께 소식 공유, 오후엔 집중해서 몰아 처리. 5시 50분부터는 가방을 정리합니다.",
      tips: ["수다의 30%를 업무 아이디어로 바꿔보세요. 정보력이 무기가 됩니다.", "중요한 마감은 캘린더에 두 번 적어두세요. 기억은 믿지 마세요.", "도와준 일은 조용히 기록해 두면 평가 때 힘이 됩니다."],
      tags: ["#사교왕", "#정보통", "#칼퇴", "#요령"],
      best: "카페인 좀비",
      bestWhy: "둘이 만나면 회의실이 가장 시끄럽습니다.",
      worst: "갓생 과몰입러",
      worstWhy: "“이거 좀 해줄래요?”가 계속 날아옵니다.",
      quote: "“커피 한잔 하실래요?”"
    },
    SIY: {
      name: "카페인 좀비",
      sub: "일 벌이고 수다 떨다 야근",
      emoji: "🧟",
      desc: "아이스 아메리카노로 하루를 시작해 네 잔째에 마감을 처리합니다. 일을 벌이는 속도가 빨라 손은 많은데 마무리가 밀립니다. 사람 좋아서 거절을 못 하는 게 원인인 경우가 많습니다.",
      day: "오전엔 새 아이디어 회의, 점심엔 수다, 오후엔 밀린 일을 몰아서. 퇴근 시간이 지나면 조용해진 사무실에서 혼자 집중합니다.",
      tips: ["“네” 대신 “언제까지 필요하세요?”라고 물어보세요. 일정이 협상 가능해집니다.", "새 일을 시작하기 전에 지금 하는 일의 마감을 확인하세요.", "카페인 양과 수면 시간을 한 번 점검해 보세요."],
      tags: ["#카페인", "#야근", "#아이디어", "#거절연습"],
      best: "월급루팡 마스터",
      bestWhy: "말리는 사람과 벌이는 사람의 균형.",
      worst: "회의실 지배자",
      worstWhy: "결론을 내라고 하면 더 벌이고 싶어집니다.",
      quote: "“아이스 아메리카노 하나 더 주세요.”"
    },
    APK: {
      name: "칼퇴요정",
      sub: "조용히 다 해놓고 정시에 사라짐",
      emoji: "🧚",
      desc: "말수는 적지만 할 일은 조용히 다 끝내놓습니다. 5시 59분에 저장하고 6시 정각에 일어섭니다. 팀에서는 “저 사람 언제 했지?” 소리를 듣는, 가장 효율적인 유형입니다.",
      day: "출근하면 이어폰을 끼고 집중, 점심은 짧게, 오후엔 마감을 정리합니다. 퇴근 인사는 짧고 정확합니다.",
      tips: ["끝낸 일을 조금만 공유해 보세요. 묵묵함이 무시가 아니라 신뢰로 이어집니다.", "급한 요청을 거절할 때는 “내일 아침 첫 번째”를 제안하세요.", "가끔은 점심에 사람들과 어울리면 평가가 달라집니다."],
      tags: ["#칼퇴", "#집중", "#효율", "#조용한실력"],
      best: "회의실 지배자",
      bestWhy: "앞에서 정리해주면 당신은 실행만 하면 됩니다.",
      worst: "카페인 좀비",
      worstWhy: "퇴근 시간에 새 일이 배달됩니다.",
      quote: "“내일 봐요.”"
    },
    API: {
      name: "눈치 백단형",
      sub: "적당히 처리하고 조용히 칼퇴",
      emoji: "🥷",
      desc: "일의 경중을 빠르게 파악해 적당히 처리합니다. “그건 담당자가 따로 있지 않나요?”로 책임을 정확히 나누고, 눈치싸움에서 이겨 조용히 퇴근합니다. 생존력은 최상위권입니다.",
      day: "아침에 메일과 메신저를 훑어 진짜 급한 것만 골라냅니다. 나머지는 정중하게 되돌려 보내고, 6시엔 조용히 사라집니다.",
      tips: ["적당함이 무책임으로 보이지 않게, 내 몫은 확실히 끝내두세요.", "되돌려 보낼 때는 대안을 한 줄 덧붙이면 인상이 달라집니다.", "가끔은 먼저 나서는 모습도 필요합니다. 1년에 한 번은."],
      tags: ["#눈치", "#생존력", "#칼퇴", "#선긋기"],
      best: "칼퇴요정",
      bestWhy: "서로 눈치를 이해해서 조용히 잘 맞습니다.",
      worst: "혼자 다 하는 형",
      worstWhy: "당신이 비운 자리를 상대가 떠안습니다.",
      quote: "“그건 담당자가 따로 있지 않나요?”"
    },
    APY: {
      name: "혼자 다 하는 형",
      sub: "일을 떠안고 묵묵히 야근",
      emoji: "🧱",
      desc: "“제가 하면 빨라요”라며 혼자 처리합니다. 책임감이 강하고 설명이 필요 없어서 팀이 편하지만, 위임을 못 해서 퇴근이 늦어집니다. 없으면 안 되는 사람이지만, 그 자리를 아무도 모릅니다.",
      day: "남이 맡은 일까지 조용히 가져와 처리합니다. 저녁 9시 사무실에 남은 불빛은 대개 이 사람 자리입니다.",
      tips: ["일을 나눠주는 것도 실력입니다. “이거 같이 해볼래요?”를 연습하세요.", "내가 한 일을 기록해 두세요. 묵묵함은 평가되지 않을 때가 많습니다.", "퇴근 시간을 지키는 연습부터. 오늘은 7시에 일어나 보세요."],
      tags: ["#책임감", "#야근", "#혼자다함", "#위임연습"],
      best: "갓생 과몰입러",
      bestWhy: "서로의 과로를 이해하는 유일한 조합.",
      worst: "눈치 백단형",
      worstWhy: "당신이 떠안은 일을 상대는 정확히 피해 갑니다.",
      quote: "“제가 하면 빨라요.”"
    },
    AIY: {
      name: "무한지연형",
      sub: "계획은 완벽, 실행은 마감 직전",
      emoji: "🐢",
      desc: "계획표와 폴더 정리는 완벽하지만 실행은 마감 직전에 몰아서 합니다. 그런데 그 순간의 집중력이 무서워서 결과물은 괜찮게 나옵니다. 매번 “다음엔 미리 하자”를 결심합니다.",
      day: "오전엔 자료 정리와 계획 수정, 오후엔 “이제 진짜 해야지”를 세 번 말하고, 저녁 7시부터 초인적인 속도로 일합니다.",
      tips: ["마감을 스스로 2일 앞당겨 잡아보세요. 작은 마감이 큰 야근을 막습니다.", "시작이 어려우면 10분만 해보세요. 대개 그대로 이어집니다.", "완벽한 계획보다 오늘 한 줄 실행이 낫습니다."],
      tags: ["#지연", "#마감직전", "#집중력", "#계획만완벽"],
      best: "회의실 지배자",
      bestWhy: "중간 점검을 해주는 사람이 옆에 있으면 달라집니다.",
      worst: "갓생 과몰입러",
      worstWhy: "비교당하면 마음만 급해집니다.",
      quote: "“오늘 안에 하면 되죠.”"
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
  var answers = new Array(QUESTIONS.length).fill(null);
  var last = null;

  function totals() {
    var t = { rel: 0, work: 0, off: 0 };
    QUESTIONS.forEach(function (q, i) {
      var a = answers[i];
      if (!a) return;
      t[a.axis] += a.w;
    });
    return t;
  }

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

  function computeScores() {
    var t = totals();
    var s = 0, p = 0, k = 0;
    answers.forEach(function (a) {
      if (!a) return;
      if (a.v === "S") s += a.w;
      if (a.v === "P") p += a.w;
      if (a.v === "K") k += a.w;
    });
    return {
      key: (s > t.rel - s ? "S" : "A") + (p > t.work - p || p === t.work ? "P" : "I") + (k > t.off - k ? "K" : "Y"),
      relPct: t.rel ? Math.round((s / t.rel) * 100) : 50,
      workPct: t.work ? Math.round((p / t.work) * 100) : 50,
      offPct: t.off ? Math.round((k / t.off) * 100) : 50
    };
  }

  function finish() {
    var sc = computeScores();
    showResult(sc.key, sc.relPct, sc.workPct, sc.offPct);
  }

  function axisRow(leftLabel, rightLabel, midLabel, rightPct) {
    return '<div class="axis">' +
      '<div class="axis-head"><span class="lo">' + leftLabel + '</span><span class="mid">' + midLabel + '</span><span class="hi">' + rightLabel + '</span></div>' +
      '<div class="axis-track on-dark"><i style="width:' + (100 - rightPct) + '%"></i></div>' +
      '<div class="axis-note"><span>' + (100 - rightPct) + '%</span><span>' + rightPct + '%</span></div>' +
    "</div>";
  }

  function showResult(key, relPct, workPct, offPct) {
    var t = TYPES[key] || TYPES.APK;
    last = { key: key, type: t, relPct: relPct, workPct: workPct, offPct: offPct };

    CT.$("#resHero").innerHTML =
      '<div class="result-hero">' +
        '<span class="r-label">나의 직장인 생존 유형</span>' +
        '<div class="r-emoji">' + t.emoji + "</div>" +
        "<h2>" + t.name + "</h2>" +
        '<p class="r-sub">' + t.sub + "</p>" +
        '<div class="axes on-dark-text">' +
          axisRow("혼자형", "사교형", relPct >= 50 ? "사교 " + relPct + "%" : "혼자 " + (100 - relPct) + "%", relPct) +
          axisRow("즉흥형", "계획형", workPct >= 50 ? "계획 " + workPct + "%" : "즉흥 " + (100 - workPct) + "%", workPct) +
          axisRow("야근형", "칼퇴형", offPct >= 50 ? "칼퇴 " + offPct + "%" : "야근 " + (100 - offPct) + "%", offPct) +
        "</div>" +
      "</div>";

    CT.$("#resBody").innerHTML =
      '<span class="type-badge">' + t.emoji + " " + t.name + "</span>" +
      "<h3>이런 사람이에요</h3><p>" + t.desc + "</p>" +
      "<h3>회사에서의 하루</h3><p>" + t.day + "</p>" +
      "<h3>생존 팁</h3><ul>" + t.tips.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>" +
      '<div class="match-grid">' +
        '<div class="match good"><b>환상의 짝</b><span>' + t.best + "</span><small style=\"display:block;margin-top:4px;font-size:11.5px;color:#0b7a47;font-weight:600;\">" + t.bestWhy + "</small></div>" +
        '<div class="match bad"><b>상극 궁합</b><span>' + t.worst + "</span><small style=\"display:block;margin-top:4px;font-size:11.5px;color:#a15c00;font-weight:600;\">" + t.worstWhy + "</small></div>" +
      "</div>" +
      '<div class="quote">' + t.quote + "<small>이 유형의 대표 대사입니다.</small></div>" +
      '<div class="tag-row">' + t.tags.map(function (x) { return "<span>" + x + "</span>"; }).join("") + "</div>";

    quizEl.classList.add("hide");
    resultEl.classList.remove("hide");
    CT.setHashCode(key + "-" + relPct + "-" + workPct + "-" + offPct);
    resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
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
    CT.copy(
      "[요즘 테스트] 직장인 생존 유형 SBTI\n" +
      "나의 유형: " + t.emoji + " " + t.name + " (" + t.sub + ")\n" +
      "관계 " + last.relPct + "% · 일 처리 " + last.workPct + "% · 칼퇴 " + last.offPct + "%\n" +
      "너는 뭐 나와: " + CT.resultUrl(last.key + "-" + last.relPct + "-" + last.workPct + "-" + last.offPct),
      "결과를 복사했어요. 동료에게 붙여넣기!"
    );
  });

  CT.$("#shareResult").addEventListener("click", function () {
    if (!last) return;
    var t = last.type;
    CT.share({
      title: "직장인 생존 유형 테스트 SBTI",
      text: "내 직장인 생존 유형은 " + t.emoji + " " + t.name + " — " + t.sub,
      url: CT.resultUrl(last.key + "-" + last.relPct + "-" + last.workPct + "-" + last.offPct)
    });
  });

  CT.$("#retryBtn").addEventListener("click", reset);

  function applyHash() {
    var m = /^([SA][PI][KY])(?:-(\d{1,3})-(\d{1,3})-(\d{1,3}))?$/.exec(CT.getHashCode() || "");
    if (!m) return false;
    var relPct = Math.max(0, Math.min(100, parseInt(m[2] || "60", 10)));
    var workPct = Math.max(0, Math.min(100, parseInt(m[3] || "60", 10)));
    var offPct = Math.max(0, Math.min(100, parseInt(m[4] || "60", 10)));
    var derived = (relPct >= 50 ? "S" : "A") + (workPct >= 50 ? "P" : "I") + (offPct >= 50 ? "K" : "Y");
    showResult(TYPES[derived] ? derived : m[1], relPct, workPct, offPct);
    return true;
  }

  if (!applyHash()) render();
  window.addEventListener("hashchange", function () { applyHash(); });
})();

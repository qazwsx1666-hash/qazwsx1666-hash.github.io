/* ==========================================================================
   극한 밸런스 게임 (15문항)
   ※ 선택 비율은 재미를 위한 예시 값입니다. 실제 집계가 아닙니다.
   ========================================================================== */
(function () {
  "use strict";

  var Q = [
    { title: "치킨 vs 피자", q: "평생 한 가지만 먹어야 한다면?", a: { label: "평생 치킨만", emo: "🍗", pct: 68, drip: "치킨은 국룰. 이건 토론할 필요도 없죠." }, b: { label: "평생 피자만", emo: "🍕", pct: 32, drip: "한 조각의 자유를 선택한 사람. 존중합니다." } },
    { title: "월급 vs 복권", q: "월급 300만 원 평생 vs 1억 복권 50%", a: { label: "월급 300만 원 평생", emo: "💼", pct: 74, drip: "계산이 빠른 사람. 통장이 고마워합니다." }, b: { label: "1억 복권 50%", emo: "🎰", pct: 26, drip: "인생은 한 방? 심장이 튼튼하시네요." } },
    { title: "연락 빈도", q: "연인과의 연락, 어느 쪽이 편한가요?", a: { label: "하루 한 번이면 충분", emo: "💬", pct: 57, drip: "신뢰파. 대신 받은 답장은 꼭 하기로." }, b: { label: "1시간마다 확인", emo: "📱", pct: 43, drip: "애정 과몰입형. 상대 폰 배터리가 걱정됩니다." } },
    { title: "칼퇴 vs 인정", q: "퇴근 시간, 당신의 선택은?", a: { label: "칼퇴", emo: "🏃", pct: 81, drip: "삶의 승리자. 오늘 저녁 메뉴가 기다립니다." }, b: { label: "야근하고 인정받기", emo: "🌙", pct: 19, drip: "성실함의 아이콘. 대신 몸이 먼저 항의할지도." } },
    { title: "계획 vs 즉흥", q: "여행은 어떻게 떠나고 싶나요?", a: { label: "계획대로 빽빽하게", emo: "🗺️", pct: 63, drip: "엑셀 여행러. 예약 확인서가 열두 장입니다." }, b: { label: "즉흥적으로 발길대로", emo: "🎒", pct: 37, drip: "발길 닿는 대로. 숙소는… 있겠죠?" } },
    { title: "첫인상 vs 대화", q: "소개팅에서 더 중요한 건?", a: { label: "첫인상", emo: "👀", pct: 44, drip: "비주얼 승부. 3초가 운명을 가릅니다." }, b: { label: "세 번째 대화", emo: "☕", pct: 56, drip: "결국 말이 살리는 사람. 만나면 오래 갑니다." } },
    { title: "아껴서 1억 vs 지금 행복", q: "돈, 어느 쪽을 고르시겠어요?", a: { label: "아껴서 1억 만들기", emo: "🏦", pct: 41, drip: "미래의 나에게 선물을 주는 중." }, b: { label: "지금 쓰고 행복하기", emo: "🛍️", pct: 59, drip: "현재의 나도 소중하니까. 통장은 응원합니다." } },
    { title: "휴대폰 확인", q: "연인의 휴대폰, 볼 수 있다면?", a: { label: "절대 안 본다", emo: "🙈", pct: 71, drip: "신뢰의 고수. 마음이 편합니다." }, b: { label: "솔직히 보고 싶다", emo: "🔍", pct: 29, drip: "궁금증이 많은 사람. 하지만 그거 독입니다." } },
    { title: "회식 참석", q: "회식, 어디까지 가시나요?", a: { label: "1차만 하고 칼퇴", emo: "🚪", pct: 66, drip: "팀워크보다 내 침대. 합리적입니다." }, b: { label: "끝까지 필참", emo: "🍻", pct: 34, drip: "네트워킹의 달인. 다음 날 숙취는 덤." } },
    { title: "여름 vs 겨울", q: "평생 한 계절만 산다면?", a: { label: "여름", emo: "☀️", pct: 52, drip: "땀은 싫지만 짧은 옷이 좋은 사람." }, b: { label: "겨울", emo: "❄️", pct: 48, drip: "이불 속이 곧 천국. 손발은 시려도 마음은 따뜻." } },
    { title: "민초 vs 반민초", q: "민트초코, 당신의 입장은?", a: { label: "민초 찬성", emo: "🌿", pct: 47, drip: "치약인지 디저트인지, 논쟁의 중심에 섰습니다." }, b: { label: "민초 반대", emo: "🚫", pct: 53, drip: "민트는 양치할 때만. 상식인이십니다." } },
    { title: "돈 vs 시간", q: "월 100만 원 용돈 vs 월 100시간 자유시간", a: { label: "월 100만 원", emo: "💸", pct: 38, drip: "현실감각 만렙. 시간은 돈으로 살 수 있죠." }, b: { label: "월 100시간", emo: "🕰️", pct: 62, drip: "시간 부자. 대신 커피값은 각오하세요." } },
    { title: "독설 vs 거짓말", q: "친구에게 어느 쪽이 낫나요?", a: { label: "솔직한 독설", emo: "🗡️", pct: 55, drip: "입은 칼, 마음은 글쎄요. 그래도 미움받을 용기." }, b: { label: "예쁜 거짓말", emo: "🎀", pct: 45, drip: "분위기 메이커. 다만 기억력이 필요합니다." } },
    { title: "결혼 로망 vs 현실", q: "결혼, 어느 쪽에 가깝나요?", a: { label: "로망", emo: "💍", pct: 42, drip: "드레스와 스드메부터 떠오르는 사람." }, b: { label: "현실", emo: "📊", pct: 58, drip: "예산표가 먼저. 낭만은 나중에 챙깁니다." } },
    { title: "인생 리셋", q: "인생을 한 번 리셋할 수 있다면?", a: { label: "리셋한다", emo: "🔄", pct: 35, drip: "후회보다 가능성. 용기가 대단합니다." }, b: { label: "지금 그대로 산다", emo: "🌳", pct: 65, drip: "지금도 충분히 잘 살고 있다는 뜻." } }
  ];

  var quizEl = CT.$("#quiz");
  var resultEl = CT.$("#result");
  var qCount = CT.$("#qCount");
  var qPercent = CT.$("#qPercent");
  var qBar = CT.$("#qBar");
  var qNo = CT.$("#qNo");
  var qTitle = CT.$("#qTitle");
  var balOpts = CT.$("#balOpts");
  var balReveal = CT.$("#balReveal");
  var balSplit = CT.$("#balSplit");
  var revealText = CT.$("#balRevealText");
  var nextBtn = CT.$("#nextBtn");
  var prevBtn = CT.$("#prevBtn");

  var idx = 0;
  var picks = new Array(Q.length).fill(null);
  var last = null;

  function render() {
    var q = Q[idx];
    qCount.textContent = (idx + 1) + " / " + Q.length;
    qPercent.textContent = Math.round((idx / Q.length) * 100) + "% 완료";
    qBar.style.width = (idx / Q.length) * 100 + "%";
    qNo.textContent = "Q" + (idx + 1);
    qTitle.textContent = q.q;

    var picked = picks[idx];
    balOpts.innerHTML = "";

    [["A", q.a], ["B", q.b]].forEach(function (pair) {
      var side = pair[0];
      var o = pair[1];
      if (side === "B") {
        var vs = document.createElement("div");
        vs.className = "bal-vs";
        vs.textContent = "VS";
        balOpts.appendChild(vs);
      }
      var b = document.createElement("button");
      b.type = "button";
      b.className = "bal-opt" +
        (picked === side ? (picked === "A" ? " is-win" : " is-win") : (picked ? " is-lose" : ""));
      b.innerHTML = '<span class="emo" aria-hidden="true">' + o.emo + "</span>" +
        "<span>" + CT.esc(o.label) + "</span>" +
        '<span class="pct">' + o.pct + "%</span>";
      b.addEventListener("click", function () { choose(side); });
      balOpts.appendChild(b);
    });

    if (picked) {
      balReveal.classList.remove("hide");
      var chosen = picked === "A" ? q.a : q.b;
      balSplit.innerHTML = '<i style="width:' + q.a.pct + '%"></i><i style="width:' + q.b.pct + '%"></i>';
      revealText.innerHTML = "<b>" + q.a.label + " " + q.a.pct + "% · " + q.b.label + " " + q.b.pct + "%</b>" +
        "<span class=\"tip\">" + chosen.drip + "</span>";
      nextBtn.textContent = idx === Q.length - 1 ? "결과 보기 →" : "다음 →";
    } else {
      balReveal.classList.add("hide");
    }

    prevBtn.disabled = idx === 0;
    if (idx === 0) prevBtn.classList.add("hide"); else prevBtn.classList.remove("hide");
  }

  function choose(side) {
    picks[idx] = side;
    render();
  }

  function finish() {
    var majCount = 0, minCount = 0;
    picks.forEach(function (p, i) {
      var majority = Q[i].a.pct >= Q[i].b.pct ? "A" : "B";
      if (p === majority) majCount += 1; else minCount += 1;
    });
    showResult(majCount, minCount);
  }

  function labelOf(maj) {
    if (maj >= 12) return { emoji: "🎯", name: "대한민국 평균의 정석", desc: "웬만한 질문에 다수 의견과 같은 답을 냈습니다. 무난함이 곧 무기입니다." };
    if (maj >= 9) return { emoji: "🙂", name: "균형 잡힌 다수파", desc: "다수 의견을 따르되, 끌리는 곳에서는 취향을 드러냈습니다." };
    if (maj >= 6) return { emoji: "🎨", name: "취향이 뚜렷한 편", desc: "남들이 뭐라 하든 내 기준이 분명한 사람입니다." };
    return { emoji: "🦄", name: "마이너리티 취향의 소유자", desc: "다수 의견이 지루하게 느껴지는 타입. 대화할 때 존재감이 큽니다." };
  }

  function showResult(majCount, minCount) {
    var lb = labelOf(majCount);
    last = { maj: majCount, min: minCount, label: lb };

    CT.$("#resHero").innerHTML =
      '<div class="result-hero">' +
        '<span class="r-label">나의 밸런스 성향</span>' +
        '<div class="r-emoji">' + lb.emoji + "</div>" +
        '<h2>다수 ' + majCount + " · 소수 " + minCount + "</h2>" +
        '<p class="r-sub">' + lb.name + " — " + lb.desc + "</p>" +
        '<div class="axes on-dark-text"><div class="axis"><div class="axis-head"><span class="lo">다수 의견</span><span class="mid">' + Math.round((majCount / Q.length) * 100) + '%</span><span class="hi">소수 의견</span></div><div class="axis-track on-dark"><i style="width:' + Math.round((majCount / Q.length) * 100) + '%"></i></div><div class="axis-note"><span>' + majCount + '문항</span><span>' + minCount + '문항</span></div></div></div>' +
      "</div>";

    var rows = Q.map(function (q, i) {
      var p = picks[i];
      var chosen = p === "A" ? q.a : q.b;
      return "<tr><td>" + q.title + "</td><td><strong>" + chosen.label + "</strong></td><td>" + q.a.pct + " : " + q.b.pct + "</td></tr>";
    }).join("");

    CT.$("#resBody").innerHTML =
      '<span class="type-badge">' + lb.emoji + " " + lb.name + "</span>" +
      "<h3>내 선택 다시 보기</h3>" +
      '<div class="table-wrap"><table><caption>15문항 전체 선택 내역</caption><thead><tr><th scope="col">질문</th><th scope="col">내 선택</th><th scope="col">A : B</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
      "<h3>이렇게 읽어 보세요</h3><p>다수 의견과 같은 선택을 한 문항이 " + majCount + "개, 소수 의견을 고른 문항이 " + minCount + "개입니다. 소수 의견이 많다고 틀린 게 아니라, 그만큼 취향이 선명하다는 뜻입니다.</p>" +
      '<p class="table-note">표시된 비율은 재미를 위한 예시 값이며 실제 참여자 집계가 아닙니다.</p>';

    quizEl.classList.add("hide");
    resultEl.classList.remove("hide");
    CT.setHashCode(picks.join(""));
    resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function reset() {
    idx = 0;
    picks = new Array(Q.length).fill(null);
    last = null;
    resultEl.classList.add("hide");
    quizEl.classList.remove("hide");
    try { history.replaceState(null, "", location.pathname); } catch (e) { /* noop */ }
    render();
    quizEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  balOpts.addEventListener("keydown", function () {});

  nextBtn.addEventListener("click", function () {
    if (!picks[idx]) return;
    if (idx < Q.length - 1) {
      idx += 1;
      render();
      quizEl.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      finish();
    }
  });

  prevBtn.addEventListener("click", function () {
    if (idx > 0) { idx -= 1; render(); }
  });

  CT.$("#copyResult").addEventListener("click", function () {
    if (!last) return;
    CT.copy(
      "[요즘 테스트] 극한 밸런스 게임\n" +
      "나는 15개 중 다수 의견 " + last.maj + " · 소수 의견 " + last.min + " — " + last.label.name + "\n" +
      "너는 뭐 골랐어: " + CT.resultUrl(picks.join("")),
      "결과를 복사했어요. 단톡방에 붙여넣기!"
    );
  });

  CT.$("#shareResult").addEventListener("click", function () {
    if (!last) return;
    CT.share({
      title: "극한 밸런스 게임",
      text: "극한 밸런스 15문항 — 나는 다수 의견 " + last.maj + " · 소수 의견 " + last.min + " (" + last.label.name + ")",
      url: CT.resultUrl(picks.join(""))
    });
  });

  CT.$("#retryBtn").addEventListener("click", reset);

  function applyHash() {
    var code = CT.getHashCode() || "";
    if (!/^[AB]{15}$/.test(code)) return false;
    picks = code.split("");
    var maj = 0, min = 0;
    picks.forEach(function (p, i) {
      var majority = Q[i].a.pct >= Q[i].b.pct ? "A" : "B";
      if (p === majority) maj += 1; else min += 1;
    });
    showResult(maj, min);
    return true;
  }

  if (!applyHash()) render();
  window.addEventListener("hashchange", function () { applyHash(); });
})();

# 건강·다이어트·수면 계산기 (health-calc)

정적 웹사이트. 빌드 도구 없이 HTML·CSS·JS만으로 동작하며, 모든 계산은 브라우저 안에서 처리됩니다.
배포 URL: `https://qazwsx1666-hash.github.io/health-calc/`

## 파일 구성

| 파일 | 역할 |
| --- | --- |
| `index.html` | 허브 랜딩. 수면 계산기를 히어로로 노출 + 5종 계산기 안내 |
| `bmi.html` | BMI 비만도·적정 체중 (아시아-태평양 기준, 게이지 바) |
| `bmr-calorie.html` | 기초대사량(BMR)·TDEE·목표별 탄단지 |
| `sleep.html` | 90분 수면 사이클 취침·기상 역산 + 공유하기 |
| `caffeine.html` | 카페인 반감기·잔존량 그래프·취침 안전 시각 |
| `water.html` | 하루 물 섭취량·생수 병 수·단백질 섭취량 |
| `privacy.html` | 개인정보처리방침 (문의 qazwsx1666@gmail.com) |
| `styles.css` | 토스풍 화이트·민트 카드 UI. `site-tax-tools/styles.css` 계승 + 건강 전용 컴포넌트 |
| `app.js` | 5개 계산기 로직 (페이지별 요소 존재 여부로 분기) |
| `og-image.png` | 1200×630 공유 이미지 |
| `sitemap.xml`, `robots.txt` | SEO 자산 |

빌드 스크립트는 사이트 폴더 밖 `work/health-calc-build/`에 있습니다
(`common.py` + 페이지별 `*.py`, 실행하면 HTML 재생성).

## 계산 기준

- **BMI**: `체중 ÷ 키(m)²`. 대한비만학회·아시아-태평양 기준 — 저체중 <18.5, 정상 18.5~22.9,
  과체중(비만 전단계) 23~24.9, 비만 1단계 25~29.9, 2단계 30~34.9, 3단계 ≥35.
  표준체중 `22×키²`, 정상 범위 `18.5×키²~22.9×키²`. 게이지는 BMI 15~40을 5구간으로 표시.
- **BMR**: Mifflin-St Jeor — 남 `10W+6.25H−5A+5`, 여 `10W+6.25H−5A−161`.
  TDEE = BMR × 활동계수(1.2 / 1.375 / 1.55 / 1.725 / 1.9).
  목표 칼로리: 유지 TDEE, 감량 TDEE−500, 증량 TDEE+300 (최소 남 1,500·여 1,200kcal).
  탄단지 비율: 유지 50/20/30, 감량 40/30/30, 증량 55/20/25 (탄·단 4kcal/g, 지 9kcal/g).
  Harris-Benedict 값은 참고용으로 함께 표시.
- **수면**: 수면 주기 90분 + 입면 15분. 기상 기준 취침 = 기상 − (90×n + 15),
  취침 기준 기상 = 취침 + (90×n + 15), n = 4·5·6주기. 5주기(7시간 30분)를 추천으로 강조.
  공유는 Web Share API → 클립보드 순으로 폴백.
- **카페인**: 음료 7종(아메리카노 150mg/355ml, 카페라떼 75mg, 에스프레소 75mg, 에너지드링크 80mg,
  녹차 30mg, 홍차 50mg, 콜라 34mg) × 잔 수. 잔존량 = 총량 × 0.5^(경과/반감기), 반감기 4·5·6시간 선택.
  안전 시각은 잔존량이 50mg(주황 없음)·100mg·30mg 이하로 떨어지는 시각. 12시간 SVG 곡선 그래프.
- **물·단백질**: 물 = 체중×30~35ml + 운동 분÷60×500ml. 500ml 병·200ml 컵 환산, 병 아이콘 시각화.
  단백질 = 체중 × (유지 1.0~1.4 / 감량 1.6~2.0 / 증량 1.6~2.2)g.

## SEO·품질 원칙

- 제목·H1·키워드에 연도 표기 없음. 페이지마다 고유 `<title>`, `<meta name="description">`,
  `rel="canonical"`, OG/Twitter 태그, `<h1>` 정확히 1개.
- JSON-LD: `WebApplication` + `FAQPage`(+ `BreadcrumbList`). 화면 FAQ와 스키마 문항이 동일.
- 계산기 페이지마다 1,800자 이상 가이드(실측 2,164~3,246자)와 FAQ 6문항.
- 상단 내비게이션은 `.calc-nav` 한 줄만 사용. 애드센스 스크립트는 미삽입
  (`google-adsense-account` 메타와 `.ad-slot` 자리만 존재, `body.has-ads`를 붙이면 노출).
- 입력값은 서버로 전송·저장하지 않음. 쿠키·로컬 저장소 미사용.

## 로컬 확인

```bash
cd work/site-health-calc && python3 -m http.server 8951
```

검증 스크립트: `LD_LIBRARY_PATH=/workspace/.browserlibs:/workspace/libs python3 work/health-calc-build/verify.py`
(로컬 서버를 띄우고 Playwright Chromium으로 콘솔 에러·SEO·계산값·320/360/390/1280px 넘침을 확인하고
`work/health-calc-shots/`에 스크린샷을 저장합니다.)

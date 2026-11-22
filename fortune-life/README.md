# 운세 툴 허브 (fortune-life)

무료 사주·오늘의 운세·궁합·로또 번호·만 나이/디데이를 한곳에 모은 정적 웹사이트입니다.
빌드 도구 없이 HTML/CSS/JS만으로 동작하며, 모든 계산은 브라우저에서만 이뤄집니다(입력값 서버 전송 없음).

- 배포 예정 URL: `https://qazwsx1666-hash.github.io/fortune-life/`
- 루트 복귀 링크: `https://qazwsx1666-hash.github.io/` (푸터 "다른 계산기 허브")

## 페이지

| 파일 | 내용 |
| --- | --- |
| `index.html` | 허브 — 도구 5종 소개·바로가기, 활용 가이드, FAQ |
| `saju.html` | 사주 풀이 — 사주팔자(연·월·일·시), 오행 비율, 일간 성격·재물운·직업운 |
| `today-fortune.html` | 오늘의 운세 — 12지신 띠 / 12별자리, 총운·금전·애정·직장·건강운, 행운 컬러·숫자·아이템·시간 |
| `chemistry.html` | 궁합 테스트 — 오행(상생·상극) + 띠(육합·삼합·상충·원진) 점수, 케미 한줄평, 결과 복사 |
| `lotto.html` | 로또 6/45 — 완전 랜덤·반자동(고정수 5/제외수 20)·홀짝 밸런스, 꿈해몽 60키워드 |
| `age-dday.html` | 만 나이·연 나이·띠·별자리·다음 생일, 100일 단위·주년 기념일, D-day |
| `privacy.html` | 개인정보처리방침 (문의: qazwsx1666@gmail.com) |

## 파일 구성

- `styles.css` — `work/finance-tools-repo/styles.css` 디자인 시스템(카드 UI·`.calc-nav` 알약 내비) + 운세용 컴포넌트(오행 색, 사주 기둥, 로또 볼, 꿈해몽 카드)
- `app.js` — 사주/운세/궁합/로또/나이 계산 엔진과 UI. 검증용으로 `window.FORTUNE_ENGINE` 노출
- `fortune-data.js` — 자동 생성 데이터
  - `lunar`: 음력 1930~2049년 (설날 양력 오프셋 + 월 길이 + 윤달)
  - `term`: 1930~2050년 절(節) 12개 시작일·시각 (연중 일수 3자리 + HHMM 4자리)
  - `dreams`: 꿈해몽 60키워드 + 행운 번호 6개
- `sitemap.xml`, `robots.txt`, `og-image.png`

## 계산 기준

- **사주**: 연주는 입춘, 월주는 절입 시각 기준. 일주는 JDN 기반 60갑자(`(JDN+49) mod 60`), 시주는 오서둔. 23시 이후는 다음 날 일진(조자시)으로 계산.
  - 절기 시각은 태양 겉보기 황경(Meeus) 계산으로 산출 → 2026년 입동 11/7 18:51 등 한국천문연구원 값과 일치 확인.
  - 음양력 변환은 한국천문연구원 음양력 데이터(`korean_lunar_calendar`)로 생성.
  - 검증: 2026-11-22 = 병오년 기해월 경자일(외부 만세력 일치), 1984-02-02(입춘 전) = 계해년 을축월 병인일.
- **오늘의 운세**: `날짜 + 띠/별자리` 해시 기반 의사난수(같은 날 같은 결과 유지), 58~98점.
- **궁합**: 기본 62점 + 오행(상생 +12 / 상극 −6 / 비화 +6) + 띠(육합 +12 / 삼합 +10 / 상충 −10 / 원진 −7) + 이름 길이(±2) → 42~98점.
- **로또**: 6/45 무작위. 밸런스 모드에서만 합계 100~180, 연속수 3개 이상 회피, 홀짝 비율 적용. 고정수·제외수는 반자동 모드에서만 사용.
- **만 나이**: 생일 경과 여부로 계산, 기념일은 시작일을 1일로 계산.

## 재생성·검증 (개발용)

```bash
# 데이터 재생성 (음양력·절기)
cd work/fortune_build && python3 gen_data.py

# HTML 재빌드 (공통 head/nav/footer + FAQ 구조화 데이터 자동 생성)
cd work/fortune_build && python3 build.py

# 로컬 서버 + Chromium 검증 (콘솔 에러·390px 레이아웃·계산 결과 89개 체크)
cd work/fortune_build && LD_LIBRARY_PATH=/workspace/libs:/workspace/.browserlibs python3 test_pages.py
```

본문 원고는 `work/fortune_build/pages/*.body.html`, 메타데이터는 `work/fortune_build/build.py`의 `PAGES`에서 관리합니다.
빌드 산출물은 `work/site-fortune-life/`에 생성됩니다.

## 배포 시 할 일 (메인 에이전트)

1. 이 폴더 전체를 저장소 루트의 `fortune-life/`로 복사
2. 루트 `index.html`에 `/fortune-life/` 링크 추가, 루트 `sitemap.xml`에 fortune-life URL 추가
3. 애드센스 스크립트는 아직 넣지 않았습니다(메타 `google-adsense-account`만 존재). 승인 후 각 페이지 `</head>`에 스크립트 추가하고 광고 슬롯 삽입

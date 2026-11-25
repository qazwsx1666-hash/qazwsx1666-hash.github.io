# 큐레이션 운영 방법 (products.json)

`/picks/` 페이지의 상품 카드는 **`data/products.json` 한 파일**에서 나옵니다.
HTML을 직접 고치지 않아도, 이 JSON만 채우고 스크립트를 한 번 돌리면 카드·구조화 데이터·갱신일이 함께 바뀝니다.

## 1. 간편링크를 채울 때 (파트너스 승인 후)

1. 파트너스에서 상품별 **간편링크**(`https://link.coupang.com/a/XXXXXXXX`)를 만듭니다.
2. `data/products.json`에서 해당 상품의 `link`에 주소를 넣고 `status`를 `active`로 바꿉니다.
   ```json
   "link": "https://link.coupang.com/a/XXXXXXXX",
   "status": "active"
   ```
3. 가격 정보가 있으면 함께 넣습니다. 없으면 `price_hint`("2만원대")만 표시됩니다.
   ```json
   "price": 12900, "list_price": 19900, "discount": 35, "is_rocket": true
   ```
4. 빌드 → 배포:
   ```bash
   python3 scripts/build_picks.py     # 카드·JSON-LD·갱신일 재생성 (수 초)
   git add -A && git commit -m "간편링크 3건 연결" && git push
   ```
5. 4~5분 뒤 GitHub Pages에 반영됩니다. `--check-links`를 붙이면 연결된 링크를 HEAD 요청으로 확인합니다.

> 링크가 없으면 카드는 `간편링크 준비 중`(회색 버튼)으로 표시되고, 판매처 검색 링크만 열립니다.

## 2. 상품·테마를 바꿀 때

- 카드 순서는 `themes[].items` 배열 순서를 따릅니다. 한 테마의 카드는 6개까지만 두는 것을 원칙으로 합니다(광고 비중 관리).
- `status`가 `broken` 또는 `retired`인 상품은 빌드에서 자동으로 빠집니다.
- 새 테마는 `picks/`에 기존 테마 HTML을 복사해 만들고, `<head>`의 ld 마커(`<!-- picks:ld:START {slug} -->`)·카드 마커(`<!-- picks:grid:START {slug} -->`)·`products.json`의 `themes` 항목을 같은 slug로 맞춥니다. `status`를 `live`로 두면 `/picks/` 허브 목록에도 자동으로 올라갑니다.

## 3. 손대면 안 되는 것 (정책)

- 링크는 **파트너스가 발급한 `link.coupang.com` 주소 그대로** 씁니다. 자체 단축·우회 도메인을 만들지 않습니다.
- 카드의 `rel="sponsored nofollow noopener"`, `광고` 표시, 페이지 최상단 대가성 고지 바는 빼지 않습니다.
- 클릭 유도 문구·자동 이동·플로팅 배너·확인되지 않은 최저가/할인율을 넣지 않습니다.
- 사이트 제목·도메인·브랜드명에 "쿠팡"을 쓰지 않습니다(본문 표기는 가능).

## 4. 빌드가 건드리는 곳

| 파일 | 바뀌는 부분 |
|---|---|
| `picks/{theme}.html` | `<!-- picks:grid:START/END slug -->` 사이 카드, `<!-- picks:ld:START/END slug -->` 아래 JSON-LD, `<time datetime>` |
| `picks/index.html` | `<!-- picks:themes:START/END -->`(live 테마), `<!-- picks:planned:START/END -->`(예정 테마), `<time datetime>` |

`<!-- ... -->` 마커 줄은 지우지 마세요. 마커가 없으면 빌드가 어떤 파일에서 실패했는지 알려주고 멈춥니다.

## 5. 확인

```bash
python3 scripts/build_picks.py --check-links    # 링크 상태까지 점검
curl -s -o /dev/null -w "%{http_code}\n" https://qazwsx1666-hash.github.io/picks/
```

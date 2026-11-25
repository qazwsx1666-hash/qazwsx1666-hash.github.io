#!/usr/bin/env python3
"""생활 준비물 큐레이션(/picks/) 페이지 빌더.

data/products.json 한 곳만 고치고 이 스크립트를 돌리면
  - /picks/{theme}.html 의 상품 카드 그리드
  - /picks/ 의 테마 목록·예정 테마
  - 각 페이지의 JSON-LD(ItemList, 가격 제외)
  - '마지막 갱신' 날짜
가 다시 그려집니다. HTML 본문(체크리스트·예산표·FAQ)은 손으로 쓴 그대로 유지됩니다.

사용법:
    python3 scripts/build_picks.py            # 렌더링 + 검증
    python3 scripts/build_picks.py --check-links   # 간편링크 HTTP 확인까지 (네트워크)
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "products.json"
PICKS = ROOT / "picks"

AFFILIATE_HOST = "link.coupang.com"
SEARCH_BASE = "https://www.coupang.com/np/search?q="

CARD_TMPL = """\
      <article class="pcard" data-id="{id}">
        <div class="pcard-thumb" aria-hidden="true"><span>{emoji}</span></div>
        <div class="pcard-body">
          <div class="pcard-badges">{badges}</div>
          <h3 class="pcard-name">{name}</h3>
          <p class="pcard-price">{price}</p>
          <p class="pcard-note">{note}</p>
          {action}
        </div>
      </article>"""


def esc(value: str | None) -> str:
    return html.escape(value or "", quote=True)


def won(value) -> str:
    try:
        return f"{int(value):,}원"
    except (TypeError, ValueError):
        return ""


def price_block(item: dict) -> str:
    """정가/할인율 UI: 판매처 가격이 연결되면 자동으로 표시, 없으면 가격대만."""
    parts: list[str] = []
    if item.get("discount"):
        parts.append(f'<span class="price-off">-{int(item["discount"])}%</span>')
    if item.get("list_price"):
        parts.append(f'<span class="price-was">{won(item["list_price"])}</span>')
    if item.get("price"):
        parts.append(f'<span class="price-now">{won(item["price"])}</span>')
        parts.append("<span>· 쿠팡에서 확인</span>")
    else:
        parts.append(f'<span class="price-now">{esc(item.get("price_hint")) or "가격대 미정"}</span>')
        parts.append("<span>· 쿠팡에서 확인</span>")
    if item.get("is_rocket"):
        parts.append('<span class="chip chip-why">로켓배송</span>')
    return "".join(parts)


def badges(item: dict) -> str:
    out = []
    if item.get("category"):
        out.append(f'<span class="chip chip-cat">{esc(item["category"])}</span>')
    if item.get("badge"):
        out.append(f'<span class="chip chip-why">{esc(item["badge"])}</span>')
    if item.get("link"):
        out.append('<span class="chip chip-ad">광고</span>')
    return "".join(out)


def action_block(item: dict) -> str:
    link = (item.get("link") or "").strip()
    query = (item.get("search_query") or item.get("name") or "").strip()
    search = SEARCH_BASE + urllib.parse.quote(query)
    if link:
        return (
            f'<a class="pcard-btn" href="{esc(link)}" target="_blank" '
            f'rel="sponsored nofollow noopener">쿠팡에서 보기 →</a>\n'
            f'          <a class="pcard-sub" href="{esc(search)}" target="_blank" '
            f'rel="nofollow noopener">다른 상품 검색</a>'
        )
    return (
        '<span class="pcard-btn is-pending" aria-disabled="true">간편링크 준비 중</span>\n'
        f'          <a class="pcard-sub" href="{esc(search)}" target="_blank" '
        f'rel="nofollow noopener">판매처에서 검색해 보기</a>'
    )


def render_card(item: dict) -> str:
    return CARD_TMPL.format(
        id=esc(item["id"]),
        emoji=esc(item.get("emoji") or "🛍️"),
        badges=badges(item),
        name=esc(item["name"]),
        price=price_block(item),
        note=esc(item.get("note")),
        action=action_block(item),
    )


def visible_items(data: dict, theme: dict) -> list[dict]:
    by_id = {i["id"]: i for i in data["items"]}
    out = []
    for item_id in theme.get("items", []):
        item = by_id.get(item_id)
        if not item:
            raise SystemExit(f"[{theme['slug']}] 없는 상품 id: {item_id}")
        if item.get("status") in ("broken", "retired"):
            continue
        out.append(item)
    return out


def itemlist_ld(theme: dict, items: list[dict], today: str) -> str:
    payload = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": theme.get("title", ""),
        "url": "https://qazwsx1666-hash.github.io" + theme["page"],
        "dateModified": today,
        "numberOfItems": len(items),
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": n,
                "name": item["name"],
            }
            for n, item in enumerate(items, start=1)
        ],
    }
    body = json.dumps(payload, ensure_ascii=False, indent=2)
    return "\n".join("  " + line for line in body.splitlines())


def replace_block(text: str, start: str, end: str, new: str, where: str) -> str:
    pattern = re.compile(re.escape(start) + r".*?" + re.escape(end), re.S)
    if not pattern.search(text):
        raise SystemExit(f"{where}: 마커를 찾지 못했습니다 ({start})")
    return pattern.sub(start + "\n" + new + "\n    " + end, text, count=1)


def theme_cards(themes: list[dict], data: dict) -> str:
    rows = []
    for theme in themes:
        items = visible_items(data, theme)
        foot = [f"준비물 {len(items)}개", "체크리스트·예산표"]
        if theme.get("tool_label"):
            foot.append(esc(theme["tool_label"]))
        rows.append(
            '      <a class="theme-card" href="./{href}">\n'
            '        <div class="t-top"><h3>{title}</h3><span class="t-season">{season}</span></div>\n'
            '        <p>{summary}</p>\n'
            '        <div class="t-foot">{foot}</div>\n'
            "      </a>".format(
                href=esc(theme["page"].rsplit("/", 1)[-1]),
                title=esc(theme["title"]),
                season=esc(theme.get("season") or "상시"),
                summary=esc(theme.get("summary")),
                foot="".join(f"<span>{f}</span>" for f in foot),
            )
        )
    return '    <div class="theme-list">\n' + "\n".join(rows) + "\n    </div>"


def planned_list(themes: list[dict]) -> str:
    rows = [
        '      <div><b>{title}</b><span>준비 중</span></div>'.format(title=esc(t["title"]))
        for t in themes
    ]
    return '    <div class="planned">\n' + "\n".join(rows) + "\n    </div>"


def check_links(items: list[dict]) -> list[str]:
    problems = []
    for item in items:
        link = (item.get("link") or "").strip()
        if not link:
            continue
        if AFFILIATE_HOST not in urllib.parse.urlparse(link).netloc:
            problems.append(f"{item['id']}: 제휴 링크가 아닌 주소 ({link})")
            continue
        req = urllib.request.Request(link, method="HEAD", headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                if resp.status >= 400:
                    problems.append(f"{item['id']}: HTTP {resp.status} ({link})")
        except Exception as exc:  # noqa: BLE001
            problems.append(f"{item['id']}: 확인 실패 {exc} ({link})")
    return problems


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check-links", action="store_true", help="간편링크 HTTP 상태 확인")
    args = parser.parse_args()

    data = json.loads(DATA.read_text(encoding="utf-8"))
    today = data.get("updated") or date.today().isoformat()

    ids = [i["id"] for i in data["items"]]
    if len(ids) != len(set(ids)):
        raise SystemExit("products.json: 상품 id 중복")

    live = [t for t in data["themes"] if t.get("status") == "live"]
    planned = [t for t in data["themes"] if t.get("status") == "planned"]

    # 1) 테마 페이지
    for theme in live:
        page = ROOT / theme["page"].lstrip("/")
        if not page.exists():
            raise SystemExit(f"테마 페이지 없음: {page}")
        text = page.read_text(encoding="utf-8")
        items = visible_items(data, theme)
        grid = "\n".join(render_card(i) for i in items)
        text = replace_block(
            text,
            f"<!-- picks:grid:START {theme['slug']} -->",
            f"<!-- picks:grid:END {theme['slug']} -->",
            "    <div class=\"grid\">\n" + grid + "\n    </div>",
            str(page),
        )
        text = replace_block(
            text,
            f"<!-- picks:ld:START {theme['slug']} -->",
            f"<!-- picks:ld:END {theme['slug']} -->",
            itemlist_ld(theme, items, today),
            str(page),
        )
        text = re.sub(
            r'<time datetime="\d{4}-\d{2}-\d{2}">\d{4}-\d{2}-\d{2}</time>',
            f'<time datetime="{today}">{today}</time>',
            text,
        )
        page.write_text(text, encoding="utf-8")
        links = sum(1 for i in items if i.get("link"))
        print(f"[OK] {theme['page']} · 카드 {len(items)}개 (링크 연결 {links}개, 대기 {len(items) - links}개)")

    # 2) 허브
    hub = PICKS / "index.html"
    text = hub.read_text(encoding="utf-8")
    text = replace_block(text, "<!-- picks:themes:START -->", "<!-- picks:themes:END -->", theme_cards(live, data), str(hub))
    text = replace_block(text, "<!-- picks:planned:START -->", "<!-- picks:planned:END -->", planned_list(planned), str(hub))
    text = re.sub(
        r'<time datetime="\d{4}-\d{2}-\d{2}">\d{4}-\d{2}-\d{2}</time>',
        f'<time datetime="{today}">{today}</time>',
        text,
    )
    hub.write_text(text, encoding="utf-8")
    print(f"[OK] /picks/ · 테마 {len(live)}개, 예정 {len(planned)}개")

    # 3) 검증
    pending = [i["id"] for i in data["items"] if i.get("status") == "pending_link"]
    if pending:
        print(f"[대기] 간편링크 미연결 {len(pending)}건: {', '.join(pending)}")

    if args.check_links:
        problems = check_links(data["items"])
        if problems:
            print("[경고] 링크 확인 문제:")
            for p in problems:
                print("   -", p)
        else:
            print("[OK] 연결된 링크 모두 정상")

    return 0


if __name__ == "__main__":
    sys.exit(main())

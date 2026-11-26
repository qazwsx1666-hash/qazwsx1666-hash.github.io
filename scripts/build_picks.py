#!/usr/bin/env python3
"""생활 준비물 큐레이션(/picks/) 페이지 빌더.

data/products.json 한 곳만 고치고 이 스크립트를 돌리면
  - /picks/{theme}.html 의 상품 카드 그리드
  - /picks/ 의 테마 목록·예정 테마
  - 각 페이지의 JSON-LD(ItemList, 가격 제외)
  - '마지막 갱신' 날짜
가 다시 그려집니다. 페이지 본문(제목·탭·푸터)과 CSS는 손으로 쓴 그대로 유지됩니다.

카드는 심플 규칙을 지킵니다: 썸네일 아이콘 + 배지 1개 + 상품명 + 한 줄 설명 + 가격대 + 버튼 1개.

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
        <div class="thumb" aria-hidden="true"><span>{emoji}</span></div>
        <div class="body">
          {badge}
          <h3 class="name">{name}</h3>
          <p class="line">{note}</p>
          <p class="price">{price}</p>
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
    """판매처 가격이 연결되면 실제 가격, 아니면 가격대 힌트만."""
    if item.get("price"):
        parts: list[str] = []
        if item.get("discount"):
            parts.append(f'<span class="off">-{int(item["discount"])}%</span>')
        if item.get("list_price"):
            parts.append(f"<s>{won(item['list_price'])}</s>")
        parts.append(f"<b>{won(item['price'])}</b>")
        return "".join(parts)
    return f"<b>{esc(item.get('price_hint')) or '가격 미정'}</b>"


def badge(item: dict) -> str:
    """카드 배지는 1개만 — 상품의 badge, 없으면 category."""
    label = item.get("badge") or item.get("category")
    return f'<span class="badge">{esc(label)}</span>' if label else ""


def action_block(item: dict) -> str:
    """버튼 1개. 제휴 링크가 없으면 가짜 링크 대신 쿠팡 검색으로 보낸다."""
    link = (item.get("link") or "").strip()
    query = (item.get("search_query") or item.get("name") or "").strip()
    search = SEARCH_BASE + urllib.parse.quote(query)
    if link:
        return (
            f'<a class="btn is-link" href="{esc(link)}" target="_blank" '
            f'rel="sponsored nofollow noopener">쿠팡에서 보기</a>'
        )
    return (
        f'<a class="btn" href="{esc(search)}" target="_blank" '
        f'rel="nofollow noopener">쿠팡에서 검색</a>'
    )


def render_card(item: dict) -> str:
    return CARD_TMPL.format(
        id=esc(item["id"]),
        emoji=esc(item.get("emoji") or "🛍️"),
        badge=badge(item),
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
    body = "\n".join("  " + line for line in body.splitlines())
    return '<script type="application/ld+json">\n' + body + '\n</script>'


def replace_block(text: str, start: str, end: str, new: str, where: str) -> str:
    pattern = re.compile(re.escape(start) + r".*?" + re.escape(end), re.S)
    if not pattern.search(text):
        raise SystemExit(f"{where}: 마커를 찾지 못했습니다 ({start})")
    return pattern.sub(start + "\n" + new + "\n    " + end, text, count=1)


THEME_ICONS = {
    "yearend-tax": "receipt",
    "start-alone": "home",
    "desk-it": "monitor",
    "winter-home": "snow",
    "kitchen-living": "pot",
    "health-diet": "heart",
    "gift-outdoor": "gift",
}


def theme_cards(themes: list[dict], data: dict) -> str:
    rows = []
    for theme in themes:
        items = visible_items(data, theme)
        icon = THEME_ICONS.get(theme.get("slug", ""), "bag")
        rows.append(
            '      <a class="theme" href="./{href}">\n'
            '        <span class="tile" aria-hidden="true"><svg><use href="#i-{icon}"/></svg></span>\n'
            '        <div class="tx"><h3>{title}</h3><p>{summary}</p></div>\n'
            '        <div class="n">{count}개<svg aria-hidden="true"><use href="#i-chev"/></svg></div>\n'
            "      </a>".format(
                href=esc(theme["page"].rsplit("/", 1)[-1]),
                icon=icon,
                title=esc(theme["title"]),
                summary=esc(theme.get("summary")),
                count=len(items),
            )
        )
    return '    <div class="themes">\n' + "\n".join(rows) + "\n    </div>"


def planned_list(themes: list[dict]) -> str:
    """예정 테마는 목록이 아니라 한 줄로만."""
    if not themes:
        return '    <p class="planned"></p>'
    names = " · ".join(esc(t["title"]) for t in themes)
    return f'    <p class="planned"><b>준비 중</b> — {names}</p>'


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

    # 심플 카드 규칙: 설명은 한 줄(60자 이내)
    long_notes = [i["id"] for i in data["items"] if len(i.get("note") or "") > 60]
    if long_notes:
        print(f"[경고] 카드 설명이 60자를 넘습니다: {', '.join(long_notes)}")

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

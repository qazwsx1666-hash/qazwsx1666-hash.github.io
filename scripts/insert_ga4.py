#!/usr/bin/env python3
"""모든 페이지 <head> 바로 뒤에 GA4(gtag.js) 스니펫을 넣는다.

- 이미 들어 있으면 건너뛴다(멱등).
- site-admin/ 과 구글·네이버 소유확인용 html 은 제외한다.
- 사용: python3 scripts/insert_ga4.py [--measurement-id G-XXXX] [--root .]
"""
import argparse
import pathlib
import sys

MARKER = "<!-- GA4 gtag -->"

SNIPPET = """{marker}
<script async src="https://www.googletagmanager.com/gtag/js?id={mid}"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){{window.dataLayer.push(arguments);}}
gtag('js', new Date());
gtag('config', '{mid}');
</script>
"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--measurement-id", default="G-HQVLV2QSHG")
    ap.add_argument("--root", default=".")
    args = ap.parse_args()

    root = pathlib.Path(args.root).resolve()
    changed, skipped, excluded = [], 0, []

    for path in sorted(root.rglob("*.html")):
        rel = path.relative_to(root).as_posix()
        if rel.startswith("site-admin/"):
            excluded.append(rel)
            continue
        name = path.name
        if name.startswith("google") or name.startswith("naver"):
            excluded.append(rel)
            continue
        text = path.read_text(encoding="utf-8", errors="strict")
        if MARKER in text or args.measurement_id in text:
            skipped += 1
            continue
        low = text.lower()
        idx = low.find("<head")
        if idx < 0:
            excluded.append(rel + " (head 없음)")
            continue
        end = text.find(">", idx)
        if end < 0:
            excluded.append(rel + " (head 닫힘 없음)")
            continue
        snippet = SNIPPET.format(marker=MARKER, mid=args.measurement_id)
        text = text[: end + 1] + "\n" + snippet + text[end + 1 :]
        path.write_text(text, encoding="utf-8")
        changed.append(rel)

    print(f"삽입 {len(changed)}건 · 이미 있음 {skipped}건 · 제외 {len(excluded)}건")
    for r in excluded:
        print("  제외:", r)
    return 0


if __name__ == "__main__":
    sys.exit(main())

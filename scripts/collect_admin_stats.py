#!/usr/bin/env python3
"""data/admin_stats.json 을 갱신한다 (관리자 페이지 /site-admin/ 의 데이터 원본).

기본 동작
  1) 브라우저 방문 카운터(countapi)에서 섹션별 오늘/누적 값을 읽어 counters 를 갱신
  2) 오늘 날짜 항목을 counters.history 에 추가하거나 덮어쓴다 (최근 30일만 보관)

옵션으로 넘긴 값만 해당 항목을 갱신하므로, 10:00 색인 점검 회차가 실제 확인한
수치만 넣으면 된다. (예: --google-indexed 24 --naver-collected 55)

사용 예
  python3 scripts/collect_admin_stats.py \
      --google-indexed 24 --google-explored 20 --naver-collected 55 --naver-errors 0 \
      --updated-by "10:00 색인 점검 회차"

갱신 후 커밋·푸시는 호출하는 쪽에서 한다.
  git -C <repo> add data/admin_stats.json && git commit -m "관리자 통계 갱신" && git push
"""
from __future__ import annotations

import argparse
import json
import pathlib
import ssl
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))
SECTIONS = [
    ("root", "포털 홈"),
    ("invest", "재테크 계산기"),
    ("career", "직장·연봉 계산기"),
    ("health", "건강 계산기"),
    ("tax", "세금 계산기"),
    ("fortune", "운세·사주"),
    ("viral", "심리테스트"),
]
API = "https://countapi.mileshilliard.com/api/v1/get/"


def get_counter(key: str):
    ctx = ssl.create_default_context()
    req = urllib.request.Request(API + key, headers={"User-Agent": "admin-stats/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=8, context=ctx) as res:
            data = json.loads(res.read().decode("utf-8"))
        return int(data.get("value"))
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return 0
        return None
    except Exception:
        return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", default="data/admin_stats.json")
    ap.add_argument("--google-indexed", type=int)
    ap.add_argument("--google-explored", type=int)
    ap.add_argument("--google-clicks", type=int)
    ap.add_argument("--google-sitemap-status")
    ap.add_argument("--total-urls", type=int)
    ap.add_argument("--requested-total", type=int)
    ap.add_argument("--naver-collected", type=int)
    ap.add_argument("--naver-errors", type=int)
    ap.add_argument("--naver-restricted", type=int)
    ap.add_argument("--blog-visitors", type=int)
    ap.add_argument("--blog-posts", type=int)
    ap.add_argument("--ga-status", choices=["waiting", "collecting"])
    ap.add_argument("--updated-by", default="scripts/collect_admin_stats.py")
    ap.add_argument("--no-counters", action="store_true", help="카운터 API 조회를 건너뛴다")
    args = ap.parse_args()

    path = pathlib.Path(args.file)
    if not path.is_absolute():
        path = pathlib.Path.cwd() / path
    if not path.exists():
        print(f"통계 파일이 없습니다: {path}", file=sys.stderr)
        return 1

    doc = json.loads(path.read_text(encoding="utf-8"))
    now = datetime.now(KST)
    today = now.strftime("%Y%m%d")
    changes = []

    # ── 카운터 ──────────────────────────────────────────────
    counters = doc.setdefault("counters", {})
    if not args.no_counters:
        sections = counters.get("sections", {})
        live = {}
        for key, label in SECTIONS:
            today_v = get_counter(f"ghq1666-{key}-d-{today}")
            total_v = get_counter(f"ghq1666-{key}-tt")
            prev = sections.get(key, {})
            sections[key] = {
                "label": label,
                "today": today_v if today_v is not None else prev.get("today", 0),
                "total": total_v if total_v is not None else prev.get("total", 0),
            }
            live[key] = sections[key]["today"]
        counters["sections"] = sections
        counters["date"] = today
        counters["fetched_at"] = now.isoformat(timespec="seconds")

        # 10:00 에는 하루가 덜 끝나 있으므로, 어제 날짜의 마지막 값을 확정 기록하고
        # 오늘 값은 '진행 중'으로 매번 덮어쓴다(다음 날 실행되면 완성된 값이 된다).
        yesterday = (now - timedelta(days=1)).strftime("%Y%m%d")
        history = counters.get("history") or []
        by_date = {}
        for h in history:
            k = "".join(ch for ch in str(h.get("date", "")) if ch.isdigit())
            if len(k) == 8:
                h = dict(h)
                h["date"] = k
                by_date[k] = h

        y_entry = {"date": yesterday}
        for key, label in SECTIONS:
            v = get_counter(f"ghq1666-{key}-d-{yesterday}")
            if v is not None:
                y_entry[key] = v
            elif yesterday in by_date:
                y_entry[key] = by_date[yesterday].get(key, 0)
            else:
                y_entry[key] = 0
        by_date[yesterday] = y_entry

        t_entry = {"date": today}
        t_entry.update({k: (v or 0) for k, v in live.items()})
        by_date[today] = t_entry

        counters["history"] = [by_date[k] for k in sorted(by_date)][-30:]
        changes.append(f"카운터({today}) " + ", ".join(f"{k}={t_entry[k]}" for k in live))
        if sum(y_entry[k] for k in live) > 0:
            changes.append(f"전일({yesterday}) 확정 " + str(sum(y_entry[k] for k in live)))

    # ── 색인 ────────────────────────────────────────────────
    ix = doc.setdefault("indexing", {})
    g = ix.setdefault("google", {})
    n = ix.setdefault("naver", {})
    if args.google_indexed is not None:
        g["indexed"] = args.google_indexed
        changes.append(f"구글 색인 {args.google_indexed}")
    if args.google_explored is not None:
        g["explored_valid"] = args.google_explored
        changes.append(f"탐색경로 유효 {args.google_explored}")
    if args.google_clicks is not None:
        g["clicks"] = args.google_clicks
    if args.google_sitemap_status:
        g["sitemap_status"] = args.google_sitemap_status
    if args.naver_collected is not None:
        n["collected"] = args.naver_collected
        changes.append(f"네이버 수집 {args.naver_collected}")
    if args.naver_errors is not None:
        n["errors"] = args.naver_errors
    if args.naver_restricted is not None:
        n["restricted"] = args.naver_restricted
    if args.total_urls is not None:
        ix["total_urls"] = args.total_urls
    if args.requested_total is not None:
        ix["requested_total"] = args.requested_total
    if any(v is not None for v in (args.google_indexed, args.naver_collected)):
        g["checked_at"] = now.strftime("%Y-%m-%d")
        n["checked_at"] = now.strftime("%Y-%m-%d")

    # ── 수익화 ──────────────────────────────────────────────
    money = doc.setdefault("monetization", {})
    blog = money.setdefault("blog", {})
    if args.blog_visitors is not None:
        blog["visitors"] = args.blog_visitors
        changes.append(f"블로그 방문자 {args.blog_visitors}")
    if args.blog_posts is not None:
        blog["post_count"] = args.blog_posts
    if args.ga_status:
        ga = doc.setdefault("ga4", {})
        ga["data_status"] = args.ga_status
        ga["data_status_label"] = "수집 대기 중 (0건)" if args.ga_status == "waiting" else "수집 중"
        changes.append(f"GA4 상태 {args.ga_status}")

    doc["schema"] = doc.get("schema", 1)
    doc["updated_at"] = now.isoformat(timespec="seconds")
    doc["updated_by"] = args.updated_by

    path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"갱신 완료: {path}")
    if changes:
        for c in changes:
            print("  -", c)
    else:
        print("  (변경된 값 없음 — 시각만 갱신)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""3개 공간(계산기 / 테스트·운세 / 추천템) 내비게이션 분리 스크립트.

2026-11-25 구조 개편: 한 도메인 안에서 서로 섞이지 않는 3개 공간으로 나눈다.
  · 계산기  : /calc/ + /finance-tools/ /invest-tools/ /tax-tools/ /career-tools/ /health-calc/
  · 테스트  : /play/ + /viral-test/ /fortune-life/
  · 추천템  : /picks/ + /about-affiliate.html
각 공간의 페이지 상단에는 그 공간 전용 내비게이션만 붙는다(포털 홈으로 돌아가는 링크 포함).
"""
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent          # qazwsx1666-hash.github.io
FIN = REPO.parent / 'finance-repo'                     # finance-tools 저장소
V = '20261125a'

CALC_CATS = [
    ('finance', '금융', '/finance-tools/'),
    ('invest', '투자', '/invest-tools/'),
    ('tax', '세금', '/tax-tools/'),
    ('career', '직장', '/career-tools/'),
    ('health', '건강', '/health-calc/'),
]

# 허브별 도구 알약 바: (라벨, 파일)
CALC_PILLS = {
    'finance': [('전체', './'), ('예적금 이자', 'savings.html'), ('실수령액', 'salary.html'),
                ('대환', 'refinance.html'), ('퇴직금·실업급여', 'severance.html'),
                ('청약·전월세', 'housing.html')],
    'invest': [('전체', './'), ('물타기', 'averaging.html'), ('월 배당', 'dividend.html'),
               ('복리', 'compound.html'), ('매도·손절', 'yield.html'), ('ISA·연금', 'isa-pension.html')],
    'tax': [('전체', './'), ('연말정산', 'yearend-tax.html'), ('중개보수', 'brokerage.html'),
            ('취득세', 'acquisition-tax.html'), ('부가세', 'vat.html'), ('유류비', 'fuel.html')],
    'career': [('전체', './'), ('자소서 글자수', 'char-count.html'), ('시급·주휴', 'weekly-pay.html'),
               ('연차·수당', 'annual-leave.html'), ('연봉 시급', 'salary-hour.html'),
               ('실업급여', 'unemployment.html')],
    'health': [('전체', './'), ('BMI', 'bmi.html'), ('칼로리', 'bmr-calorie.html'),
               ('수면', 'sleep.html'), ('카페인', 'caffeine.html'), ('물·단백질', 'water.html')],
    'viral': [('전체', './'), ('에겐·테토', 'egen-teto.html'), ('직장인 SBTI', 'office-sbti.html'),
              ('연애 애착', 'love-type.html'), ('밸런스', 'balance.html'), ('MBTI 1분', 'mbti-mini.html')],
    'fortune': [('전체', './'), ('사주', 'saju.html'), ('오늘의 운세', 'today-fortune.html'),
                ('궁합', 'chemistry.html'), ('로또', 'lotto.html'), ('만 나이', 'age-dday.html')],
}

FOLDER_CAT = {
    'invest-tools': 'invest', 'tax-tools': 'tax', 'career-tools': 'career',
    'health-calc': 'health', 'viral-test': 'viral', 'fortune-life': 'fortune',
}


def calc_header(active):
    tabs = []
    for key, label, href in [('', '전체', '/calc/')] + CALC_CATS:
        on = ' class="on"' if key == active else ''
        tabs.append(f'      <a href="{href}"{on}>{label}</a>')
    return (
        '<header class="cbar">\n'
        '  <div class="cbar-in">\n'
        '    <a class="cbar-portal" href="/">← 포털 홈</a>\n'
        '    <a class="cbar-brand" href="/calc/">'
        '<span class="cbar-mark" aria-hidden="true">₩</span>생활·금융 계산기</a>\n'
        '    <nav class="cbar-tabs" aria-label="계산기 카테고리">\n'
        + '\n'.join(tabs) + '\n'
        '    </nav>\n'
        '  </div>\n'
        '</header>\n'
    )


def play_header(active):
    tabs = []
    for key, label, href in [('', '전체', '/play/'), ('viral', '심리테스트 5종', '/play/#tests'),
                             ('fortune', '운세·사주 5종', '/play/#fortune')]:
        on = ' class="on"' if key == active else ''
        tabs.append(f'      <a href="{href}"{on}>{label}</a>')
    return (
        '<header class="pbar">\n'
        '  <div class="pbar-in">\n'
        '    <a class="pbar-portal" href="/">← 포털 홈</a>\n'
        '    <a class="pbar-brand" href="/play/">'
        '<span class="pbar-mark" aria-hidden="true">🔮</span>심리테스트·운세</a>\n'
        '    <nav class="pbar-tabs" aria-label="테스트·운세 메뉴">\n'
        + '\n'.join(tabs) + '\n'
        '    </nav>\n'
        '  </div>\n'
        '</header>\n'
    )


def pills(kind, cat, current):
    cls = 'cpills' if kind == 'calc' else 'ppills'
    items = []
    for label, fname in CALC_PILLS[cat]:
        on = ' class="on"' if fname == current else ''
        href = './' if fname == './' else f'./{fname}'
        items.append(f'    <a href="{href}"{on}>{label}</a>')
    return f'<nav class="{cls}" aria-label="이 허브의 도구">\n  <div class="{cls}-in">\n' \
           + '\n'.join(items) + f'\n  </div>\n</nav>\n'


def relink_calc_footer(s: str) -> str:
    """계산기 공간 푸터에서 포털/추천템으로 흩어지는 링크를 공간 안 링크로 바꾼다."""
    s = s.replace('<a href="https://qazwsx1666-hash.github.io/">전체 사이트</a>',
                  '<a href="/calc/">전체 계산기</a>')
    s = s.replace('<a href="https://qazwsx1666-hash.github.io/">전체 계산기</a>',
                  '<a href="/calc/">전체 계산기</a>')
    return s


def patch_calc_page(path: Path, cat: str):
    s = path.read_text(encoding='utf-8')
    current = './' if path.name == 'index.html' else path.name
    body = calc_header(cat) + pills('calc', cat, current)

    m = re.search(r'<header class="site-header">[\s\S]*?</header>', s)
    if not m:
        raise SystemExit(f'header not found: {path}')
    s = s[:m.start()] + body.rstrip('\n') + s[m.end():]

    # 기존 알약 바 제거(새 알약 바로 대체)
    s = re.sub(r'\s*<nav class="calc-nav"[\s\S]*?</nav>\s*', '\n', s, count=1)

    # 스타일시트
    if '/shell/calc.css' not in s:
        s = s.replace('</head>', f'<link rel="stylesheet" href="/shell/calc.css?v={V}">\n</head>', 1)
    s = relink_calc_footer(s)

    path.write_text(s, encoding='utf-8')
    return True


def patch_play_page(path: Path, cat: str):
    s = path.read_text(encoding='utf-8')
    current = './' if path.name == 'index.html' else path.name
    body = play_header(cat) + pills('play', cat, current)

    m = re.search(r'<header class="site-header">[\s\S]*?</header>', s)
    if not m:
        raise SystemExit(f'header not found: {path}')
    s = s[:m.start()] + body.rstrip('\n') + s[m.end():]
    s = re.sub(r'\s*<nav class="calc-nav"[\s\S]*?</nav>\s*', '\n', s, count=1)

    if '/shell/play.css' not in s:
        s = s.replace('</head>', f'<link rel="stylesheet" href="/shell/play.css?v={V}">\n</head>', 1)

    path.write_text(s, encoding='utf-8')
    return True


def main():
    done = []

    # ── 계산기 공간 (루트 저장소)
    for folder, cat in FOLDER_CAT.items():
        if cat in ('viral', 'fortune'):
            continue
        for p in sorted((REPO / folder).glob('*.html')):
            patch_calc_page(p, cat)
            done.append(p)

    # ── 테스트·운세 공간
    for folder, cat in [('viral-test', 'viral'), ('fortune-life', 'fortune')]:
        for p in sorted((REPO / folder).glob('*.html')):
            patch_play_page(p, cat)
            done.append(p)

    # ── finance-tools 저장소(별도 저장소, 경로는 /finance-tools/)
    if FIN.exists():
        for p in sorted(FIN.glob('*.html')):
            if p.name.startswith('google'):
                continue
            s = p.read_text(encoding='utf-8')
            if '<header' not in s:
                continue
            patch_calc_page(p, 'finance')
            done.append(p)

    print(f'patched {len(done)} pages')
    for p in done:
        print(' ', p)


if __name__ == '__main__':
    main()

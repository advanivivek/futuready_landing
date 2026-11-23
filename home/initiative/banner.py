"""
Banners for the Futuready pages on Hack2skill: one wide (3:1, desktop) and one square (1:1, phones) per page.

    python3 home/initiative/banner.py   -> home/initiative/assets/banners/<page>-desktop.png and <page>-mobile.png

Pictures first, few words: the hook, the date board and the characters. The page title under the banner
already names the place, so the banner does not repeat it. The date comes from PAGES in build.py.
Needs Playwright (set PLAYWRIGHT to playwright-core's index.mjs if it is not installed here).
"""
import os
import subprocess
from pathlib import Path

from build import PAGES

HERE = Path(__file__).parent
ROOT = HERE.parent
F = (ROOT / 'public/fonts').as_uri()
S = (ROOT / 'public/story').as_uri()
OUT = HERE / 'assets/banners'

CSS = f"""
@font-face{{font-family:Unb;src:url('{F}/unbounded.woff2')}}@font-face{{font-family:Syn;src:url('{F}/syncopate-700.woff2')}}
@font-face{{font-family:Mono;src:url('{F}/geist-mono.woff2')}}
html,body{{margin:0;overflow:hidden}}
body{{position:relative;background:#3463af;color:#efe6d2}}
.floor{{position:absolute;left:0;right:0;bottom:0;background:#efe6d2}}
.brand{{position:absolute;font:700 var(--b)/1 Syn;letter-spacing:.1em}}
h1{{position:absolute;margin:0;font:700 var(--h)/.98 Unb;letter-spacing:-.05em}}
h1 em{{font-style:normal;color:#f2b230}}
.cut{{position:absolute;filter:drop-shadow(0 4px 3px rgba(10,12,30,.18)) drop-shadow(0 14px 18px rgba(10,12,30,.14))}}
.board{{position:absolute;display:grid;justify-items:end;gap:calc(var(--f)*.14)}}
.board small{{font:600 calc(var(--f)*.36)/1 Mono;letter-spacing:.18em;text-transform:uppercase}}
.row{{display:flex;gap:calc(var(--f)*.08);padding:calc(var(--f)*.1);border-radius:calc(var(--f)*.16);background:#161a3a;box-shadow:0 14px 26px rgba(10,12,30,.3)}}
.row b{{position:relative;width:calc(var(--f)*.78);height:calc(var(--f)*1.08);display:grid;place-items:center;border-radius:calc(var(--f)*.08);
  background:linear-gradient(#2a2f5c 50%,#242952 50%);color:#fffcf5;font:700 var(--f)/1 Mono}}
.row b::after{{content:'';position:absolute;left:0;right:0;top:50%;height:2px;background:rgba(0,0,0,.55)}}
"""


def board(label, rows):
    return f"<div class='board'><small>{label}</small>" + ''.join(f"<span class='row'>{''.join(f'<b>{c}</b>' for c in r)}</span>" for r in rows) + '</div>'


def page(p, wide):
    rows = [p['day'], p['month']] if p['weekday'] else ['LIVE', 'ONLINE']
    label = p['weekday'] if p['weekday'] else 'Virtual'
    if wide:
        size, lay = (1800, 600), """
--b:30px;--h:104px;--f:60px}
.floor{height:120px}.brand{left:96px;top:78px}h1{left:92px;top:148px}
.board{right:84px;top:62px}
.girl{left:1020px;bottom:40px;height:430px}.boy{left:1205px;bottom:52px;height:405px}.bot{left:1440px;bottom:48px;height:236px}"""
    else:
        size, lay = (1080, 1080), """
--b:38px;--h:108px;--f:70px}
.floor{height:230px}.brand{left:76px;top:84px}h1{left:70px;top:170px}
.board{right:70px;top:66px}
.girl{left:110px;bottom:110px;height:400px}.boy{left:370px;bottom:126px;height:380px}.bot{left:700px;bottom:120px;height:236px}"""
    w, h = size
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}
body{{width:{w}px;height:{h}px;{lay}
</style></head><body>
<div class="floor"></div>
<span class="brand">FUTUREADY</span>
<h1>Are you<br>ready for<br>the <em>future?</em></h1>
{board(label, rows)}
<img class="cut girl" src="{S}/girl-phone.webp"><img class="cut boy" src="{S}/boy-laptop.webp"><img class="cut bot" src="{S}/bot-wave.webp">
</body></html>"""
    return html, size


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    pw = os.environ.get('PLAYWRIGHT', 'playwright-core')
    for key, p in PAGES.items():
        for wide, tag in ((True, 'desktop'), (False, 'mobile')):
            html, (w, h) = page(p, wide)
            src = OUT / f'{key}-{tag}.html'
            src.write_text(html)
            js = (f"const {{chromium}}=await import({pw!r});const b=await chromium.launch();"
                  f"const p=await b.newPage({{viewport:{{width:{w},height:{h}}}}});await p.goto({src.as_uri()!r});"
                  f"await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);"
                  f"await p.screenshot({{path:{str(OUT / f'{key}-{tag}.png')!r}}});await b.close();")
            subprocess.run(['node', '--input-type=module', '-e', js], check=True)
            print('saved', OUT / f'{key}-{tag}.png')

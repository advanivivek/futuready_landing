"""
The designed look of the Futuready sections (the visual source for the passport picture and the old previews).

The live pages are made with the page maker instead: npm --prefix home run maker  (home/maker/).
Hack2skill's editor drops stylesheets, so these designed sections are not pasted as they are.
"""
import html
import json
from pathlib import Path

HERE = Path(__file__).parent
IMG = json.loads((HERE / 'assets/hosted.json').read_text())

# ---------------------------------------------------------------- the pages
QUOTES = [
    ('One of those rare sessions where you don’t feel bored even for a second!', 'Swapnaja Waghapure', 'MCA student'),
    ('One more step towards becoming a builder rather than just a thinker.', 'Durga Khadbade', 'Engineering student, TAE Pune'),
    ('Live interactive activities, multiple levels to progress through, and a team-based prompting challenge.', 'Aditi Guddeti', 'IT engineering, GDG TAE'),
]
LABELS = ['DevRel · Hack2skill', 'Architect', 'Builds AI products', 'Loves Math', 'Dances Salsa', 'Plays music', 'Cares about Humanity']

PAGES = {
    'vadodara': {
        'slug': 'futuready-vadodara-07122026',
        'edition': 'Campus edition',
        'day': '07', 'month': 'DEC', 'weekday': 'Monday', 'date': 'Mon, 7 Dec 2026',
        'where': 'Parul University, Vadodara',
        'format': 'In person · 2 hours · Free',
        'partner': True,
        'board_label': 'Arrives',
        # The key facts at the top of the page, and the schedule (times confirmed by the campus).
        'facts': [('Date', 'Monday, 7 December 2026'), ('Time', '12:45 PM to 3:30 PM'), ('Venue', 'Parul University, Vadodara'),
                  ('Entry', 'Free for students. Registering takes a minute.'), ('For', 'College students. Any year, any branch.')],
        'schedule': [
            ('12:45 – 1:00 PM', 'Arrival and registration', 'Scan the QR code. Your name lights up the big screen.'),
            ('1:00 – 3:00 PM', 'Futuready hands-on bootcamp', 'Five levels, live on your phone. Then the boss level: your squad builds with AI.'),
            ('3:00 – 3:15 PM', 'Q&A and group photograph', ''),
            ('3:15 – 3:30 PM', 'Goodies and wrap-up', ''),
        ],
        'schedule_note': 'We will email you the hall before the day.',
        'calendar': ('20261207T071500Z', '20261207T100000Z'),  # 12:45 PM to 3:30 PM IST, in UTC, for the add-to-calendar link
        'who': 'College students from any year and any branch, in and around Vadodara. Beginners are welcome, and seniors get harder challenges in the same room.',
        'where_faq': ('Where and when exactly?', 'Monday, 7 December 2026, 12:45 PM to 3:30 PM, at Parul University, Vadodara. We will email you the hall before the day.'),
        'need_laptop': 'No. Your phone is enough for the whole session. For the build, one laptop per squad of four helps, but it is not a must.',
        'bring': 'A charged phone and your curiosity. A laptop if you have one.',
        'why_register': 'It helps us plan seats and saves you time at the door. Registering is not a guarantee of a seat; entry is confirmed on the day.',
        'day_title': 'Schedule',
        'day_steps': [
            ('15 min', 'Doors open', 'Take a seat. Scan the QR code. Your name lights up the big screen.'),
            ('15 min', 'Warm up and the big question', 'Fast games, honest polls, and the question of the day.'),
            ('45 min', 'Levels R, E, A, D', 'The Literal Bot, the Bug Hunt, System Test and your AI team.'),
            ('40 min', 'Boss level Y', 'Squad up, spec it, build it with AI, then break it.'),
            ('10 min', 'Your e-passport', 'The last stamp, your signed passport, and what comes next.'),
        ],
    },
    'virtual': {
        'slug': 'futuready-virtual',
        'edition': 'Virtual edition',
        'day': '--', 'month': 'TBA', 'weekday': '', 'date': 'Next session: date soon',
        'where': 'Online, from anywhere',
        'format': 'Online · 2 hours · Free',
        'partner': False,
        'board_label': 'Next session',
        'facts': [('When', 'A new session every few weeks'), ('Time', 'About 2 hours. Each date and time comes by email.'),
                  ('Where', 'Online, from anywhere'), ('Entry', 'Free. Register once for every session.'),
                  ('For', 'College students. Any year, any branch.')],
        'schedule': [
            ('First 5 min', 'Join and say hi', 'Open the link and scan the QR code. Your name lights up the shared screen.'),
            ('Next 1 hr 45 min', 'Futuready hands-on bootcamp', 'Five levels, live on your phone. Then the boss level: you build with AI.'),
            ('Last 10 min', 'Q&A and your e-passport', ''),
        ],
        'schedule_note': 'Every session runs this way. The date, time and joining link reach you by email.',
        'email_note': 'Before each session, we email you its date, time and joining link.',
        'who': 'College students from any year and any branch, anywhere in India. If you can join a video call, you can join Futuready.',
        'where_faq': ('How do I join a session?', 'Register once on this page. Before every session we email you the date, the time and the joining link, so you can come to the next one or any later one.'),
        'need_laptop': 'A phone is enough to play along. A laptop helps for the build in the boss level, but it is not a must.',
        'bring': 'A charged phone with internet, a quiet corner, and your curiosity. A laptop if you have one.',
        'why_register': 'Registering once keeps you on the list for every session: you get each date and joining link by email.',
        'day_title': 'How a session goes',
        'day_steps': [
            ('5 min', 'Join and say hi', 'Open the link, scan the QR code. Your name lights up the shared screen.'),
            ('15 min', 'Warm up and the big question', 'Fast games, honest polls, and the question of the day.'),
            ('45 min', 'Levels R, E, A, D', 'The Literal Bot, the Bug Hunt, System Test and your AI team.'),
            ('40 min', 'Boss level Y', 'Spec it, build it with AI, then break it, on your own or with friends on the call.'),
            ('10 min', 'Your e-passport', 'The last stamp, your signed passport, and when the next session is.'),
        ],
    },
}

LEVELS = [
    ('R', 'Level 1', 'Requirements', ['AI does literally', 'what you say.'], ['Learn the art', 'of spec writing.'], '#f2a7b8', '#e98ca2', '#161a3a'),
    ('E', 'Level 2', 'Evaluate', ['If it looks right,', 'Is it really right?'], ['Learn to evaluate how', 'Anthropic engineers do.'], '#9ed6c0', '#86c8ae', '#161a3a'),
    ('A', 'Level 3', 'Architect', ['Anyone can', 'stack blocks.'], ['Learn to architect', 'scalable AI systems.'], '#f2b230', '#e3a21c', '#161a3a'),
    ('D', 'Level 4', 'Direct', ['Nobody codes', 'alone anymore.'], ['Learn to direct', 'a team of AI Agents'], '#c3b5f2', '#ae9deb', '#161a3a'),
]
STAMP_INK = [('R', 'REQUIREMENTS', '#C83A5B', -12), ('E', 'EVALUATE', '#0F8F6A', 8), ('A', 'ARCHITECT', '#1A6FC0', -5), ('D', 'DIRECT', '#D2600F', 11), ('Y', 'YOU', '#B86E00', -8)]

# ---------------------------------------------------------------- shared look
FONTS = "@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400..700&family=Geist+Mono:wght@500..600&family=Syncopate:wght@700&family=Unbounded:wght@600..900&display=swap');"
BASE = """
.fr{--blue:#3463af;--marigold:#f2b230;--cream:#efe6d2;--paper:#fffcf5;--ink:#161a3a;--night:#1d1236;
  container-type:inline-size;font:400 16px/1.5 'Geist',system-ui,-apple-system,'Segoe UI',sans-serif;color:var(--ink);
  -webkit-font-smoothing:antialiased;margin:0 0 8px;text-align:left}
.fr *,.fr *::before,.fr *::after{box-sizing:border-box}
.fr p,.fr h3,.fr h4,.fr ul,.fr ol,.fr figure,.fr blockquote{margin:0;padding:0}
.fr ul,.fr ol{list-style:none}
.fr img{display:block;max-width:none;height:auto}
.fr a{color:inherit}
.fr .fr-d{font-family:'Unbounded',system-ui,sans-serif;font-weight:700;letter-spacing:-.045em;line-height:1.02}
.fr .fr-mono{font-family:'Geist Mono',ui-monospace,Menlo,monospace;font-weight:600;letter-spacing:.02em}
.fr .fr-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 28px;border-radius:999px;
  background:var(--ink);color:#fffcf5;font:600 16px/1 'Geist',system-ui,sans-serif;letter-spacing:-.01em;text-decoration:none;
  transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
.fr .fr-btn:hover{transform:translateY(-2px)}
.fr .fr-btn:active{transform:scale(.96)}
.fr .fr-btn--y{background:var(--marigold);color:var(--ink)}
.fr .fr-cut{filter:drop-shadow(0 3px 2px rgba(10,12,30,.16)) drop-shadow(0 10px 14px rgba(10,12,30,.12))}
.fr .fr-note{font:500 13px/1.5 'Geist Mono',ui-monospace,monospace;opacity:.8}
"""


def section(name, css, body):
    return f"<!-- Futuready by H2S: {name}. HTML and CSS only. Made with home/initiative/build.py -->\n<style>\n{FONTS}\n{BASE}\n{css.strip()}\n</style>\n{body.strip()}\n"


def reg(p):
    return f"https://hack2skill.com/event/{p['slug']}/registration"


def flaps(p, big=False):
    cls = 'fr-flaps fr-flaps--big' if big else 'fr-flaps'
    rows = ''.join(f"<span class=\"fr-flaprow\">{''.join(f'<b>{html.escape(c)}</b>' for c in row)}</span>" for row in (p['day'], p['month']))
    return f'<div class="{cls}" role="img" aria-label="{html.escape(p["board_label"])}: {html.escape(p["date"])}"><small class="fr-mono">{html.escape(p["board_label"])}</small>{rows}</div>'


FLAP_CSS = """
.fr .fr-flaps{display:grid;justify-items:end;gap:5px;font-family:'Geist Mono',ui-monospace,monospace}
.fr .fr-flaps small{font-size:11px;letter-spacing:.16em;text-transform:uppercase;opacity:.85}
.fr .fr-flaprow{display:flex;gap:3px;padding:4px;border-radius:7px;background:#161a3a;box-shadow:0 10px 20px rgba(10,12,30,.25)}
.fr .fr-flaprow b{position:relative;width:1.05em;height:1.45em;display:grid;place-items:center;border-radius:3px;
  background:linear-gradient(to bottom,#2a2f5c 50%,#242952 50%);color:#fffcf5;font-size:26px;font-weight:700;line-height:1}
.fr .fr-flaprow b::after{content:'';position:absolute;left:0;right:0;top:50%;height:1px;background:rgba(0,0,0,.55)}
.fr .fr-flaps--big .fr-flaprow b{font-size:clamp(28px,7cqw,44px)}
"""


# ---------------------------------------------------------------- 1. about
def about(p):
    css = FLAP_CSS + """
.fr-about .fr-card{position:relative;overflow:hidden;border-radius:22px;background:var(--blue);color:var(--cream);padding:26px 24px 0}
.fr-about .fr-top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
.fr-about .fr-eyebrow{font-size:12px;letter-spacing:.14em;text-transform:uppercase;opacity:.9}
.fr-about .fr-brand{display:block;margin-top:8px;font:700 clamp(15px,3.2cqw,20px)/1 'Syncopate',sans-serif;letter-spacing:.08em}
.fr-about h3{margin-top:18px;font-size:clamp(28px,6.4cqw,46px);color:var(--cream);max-width:13ch}
.fr-about h3 em{font-style:normal;color:var(--marigold)}
.fr-about .fr-facts{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
.fr-about .fr-facts li{padding:7px 12px;border-radius:999px;background:rgba(255,252,245,.14);font:500 13px/1.2 'Geist Mono',monospace}
.fr-about .fr-cta{margin-top:20px;display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px}
.fr-about .fr-cta .fr-note{color:var(--cream)}
.fr-about .fr-stage{position:relative;height:250px;margin:14px -24px 0}
.fr-about .fr-floor{position:absolute;left:0;right:0;bottom:0;height:74px;background:var(--cream)}
.fr-about .fr-stage img{position:absolute;bottom:22px}
.fr-about .fr-girl{left:calc(50% - 150px);height:205px}
.fr-about .fr-boy{left:calc(50% - 40px);height:196px;bottom:30px!important}
.fr-about .fr-bot{left:calc(50% + 82px);height:118px}
.fr-about .fr-sun{position:absolute;right:28px;top:-20px;width:54px;height:54px;border-radius:50%;background:var(--marigold)}
.fr-about .fr-lines{margin-top:22px}
.fr-about .fr-big{font:600 clamp(20px,4.4cqw,26px)/1.18 'Geist',sans-serif;letter-spacing:-.03em}
.fr-about .fr-lines p+p{margin-top:10px;font-size:16px;opacity:.85;max-width:52ch}
.fr-about .fr-partner{margin-top:22px;padding:18px 20px;border-radius:18px;background:var(--paper);box-shadow:0 1px 0 rgba(0,0,0,.05),0 10px 24px rgba(10,12,30,.08)}
.fr-about .fr-label{font-size:11px;letter-spacing:.16em;text-transform:uppercase;opacity:.7}
.fr-about .fr-logos{display:flex;flex-wrap:wrap;align-items:center;gap:14px 30px;margin-top:12px}
.fr-about .fr-logos img{height:42px;width:auto}
.fr-about .fr-logos img+img{height:38px}
@container (min-width:620px){
  .fr-about .fr-card{padding:34px 34px 0;min-height:360px}
  .fr-about .fr-copy{max-width:57%}
  .fr-about h3{font-size:clamp(28px,5cqw,40px);max-width:12ch}
  .fr-about .fr-stage{position:absolute;right:0;bottom:0;width:41%;height:100%;margin:0}
  .fr-about .fr-girl{left:2%;height:212px}
  .fr-about .fr-boy{left:36%;height:202px}
  .fr-about .fr-bot{left:70%;height:116px}
  .fr-about .fr-floor{height:64px}
  .fr-about .fr-sun{display:none}
  .fr-about .fr-top .fr-flaps{position:absolute;right:30px;top:28px;z-index:2}
}
"""
    partner = ''
    if p['partner']:
        partner = f"""
  <div class="fr-partner">
    <p class="fr-mono fr-label">Campus Organising Partner</p>
    <div class="fr-logos"><img src="{IMG['parulUniversity']}" alt="Parul University" width="152" height="42" loading="lazy"><img src="{IMG['puAiSociety']}" alt="The PU AI Society" width="139" height="38" loading="lazy"></div>
  </div>"""
    body = f"""
<section class="fr fr-about">
  <div class="fr-card">
    <div class="fr-top">
      <div class="fr-copy">
        <p class="fr-mono fr-eyebrow">{html.escape(p['edition'])}</p>
        <span class="fr-brand" aria-label="Futuready by H2S">FUTUREADY</span>
        <h3 class="fr-d">Are you ready for the <em>future?</em></h3>
        <ul class="fr-facts">
          <li>{html.escape(p['date'])}</li>
          <li>{html.escape(p['where'])}</li>
          <li>{html.escape(p['format'])}</li>
        </ul>
        <div class="fr-cta"><a class="fr-btn fr-btn--y" href="{reg(p)}">Register free</a><span class="fr-note">Takes a minute.</span></div>
      </div>
      {flaps(p)}
    </div>
    <div class="fr-stage" aria-hidden="true">
      <i class="fr-sun"></i>
      <div class="fr-floor"></div>
      <img class="fr-cut fr-girl" src="{IMG['girlPhone']}" alt="" loading="lazy">
      <img class="fr-cut fr-boy" src="{IMG['boyLaptop']}" alt="" loading="lazy">
      <img class="fr-cut fr-bot" src="{IMG['botWave']}" alt="" loading="lazy">
    </div>
  </div>
  <div class="fr-lines">
    <p class="fr-big">Futuready is not a lecture.<br>It is an interactive lab.</p>
    <p>Students participate in realtime via their phones: five levels that spell R.E.A.D.Y., a live leaderboard, and an e-passport at the end.</p>
  </div>{partner}
</section>"""
    return section('About', css, body)


# ---------------------------------------------------------------- 2. levels
def levels(p):
    css = """
.fr-levels .fr-intro{font:600 clamp(19px,4cqw,24px)/1.2 'Geist',sans-serif;letter-spacing:-.03em;max-width:30ch}
.fr-levels .fr-grid{display:grid;gap:12px;margin-top:18px}
.fr-levels .fr-lv{position:relative;overflow:hidden;min-height:168px;padding:20px 20px 18px;border-radius:20px;background:var(--wall);color:var(--fg)}
.fr-levels .fr-lv b.fr-letter{position:absolute;right:-6px;bottom:-26px;font:900 150px/1 'Unbounded',sans-serif;letter-spacing:-.06em;color:var(--tint);pointer-events:none}
.fr-levels .fr-lv .fr-tag{display:flex;align-items:center;gap:8px;font-size:12px}
.fr-levels .fr-lv .fr-tag i{width:10px;height:10px;border-radius:50%;background:var(--fg);opacity:.7}
.fr-levels .fr-lv .fr-say{position:relative;margin-top:12px;font:600 21px/1.15 'Geist',sans-serif;letter-spacing:-.03em}
.fr-levels .fr-lv .fr-learn{position:relative;margin-top:10px;font:400 18px/1.2 'Geist',sans-serif;letter-spacing:-.02em}
.fr-levels .fr-lv--y{--wall:#151a45;--fg:#efe6d2;--tint:#1f2660}
.fr-levels .fr-lv--y .fr-you{position:relative;display:block;margin-top:4px;font:700 46px/1 'Unbounded',sans-serif;letter-spacing:-.05em;color:var(--marigold)}
.fr-levels .fr-lv--y .fr-note{position:relative;margin-top:8px;color:var(--cream)}
@container (min-width:560px){
  .fr-levels .fr-grid{grid-template-columns:1fr 1fr}
  .fr-levels .fr-lv--y{grid-column:1 / -1}
}
"""
    cards = ''
    for k, lv, name, say, learn, wall, tint, fg in LEVELS:
        cards += f"""
    <li class="fr-lv" style="--wall:{wall};--tint:{tint};--fg:{fg}">
      <b class="fr-letter" aria-hidden="true">{k}</b>
      <p class="fr-mono fr-tag"><i></i>{lv} • {name}</p>
      <p class="fr-say">{say[0]}<br>{say[1]}</p>
      <p class="fr-learn">{learn[0]}<br>{learn[1]}</p>
    </li>"""
    cards += """
    <li class="fr-lv fr-lv--y">
      <b class="fr-letter" aria-hidden="true">Y</b>
      <p class="fr-mono fr-tag"><i></i>Level 5 • You</p>
      <p class="fr-say">And the last level <span class="fr-you">is you</span></p>
      <p class="fr-note">› the unique part that nobody can steal</p>
    </li>"""
    body = f"""
<section class="fr fr-levels">
  <p class="fr-intro">Futuready is an interactive bootcamp that teaches you exactly that, through five levels that spell R.E.A.D.Y.</p>
  <ol class="fr-grid">{cards}
  </ol>
</section>"""
    return section('What you will learn', css, body)


# ---------------------------------------------------------------- 3. passport
def stamp_svg(k, word, ink, sid):
    return (f'<svg viewBox="0 0 200 200" aria-hidden="true"><defs><path id="{sid}" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"/></defs>'
            f'<g fill="none" stroke="{ink}" stroke-width="5"><circle cx="100" cy="100" r="95"/><circle cx="100" cy="100" r="64" stroke-width="2.5"/></g>'
            f'<text font-family="Geist, sans-serif" font-weight="700" font-size="12.5" letter-spacing="3.2" fill="{ink}"><textPath href="#{sid}" textLength="482" lengthAdjust="spacing">FUTUREADY · BUILDERS LAB · HACK2SKILL · </textPath></text>'
            f'<text x="100" y="116" text-anchor="middle" font-family="Unbounded, sans-serif" font-weight="800" font-size="70" fill="{ink}">{k}</text>'
            f'<text x="100" y="148" text-anchor="middle" font-family="Geist, sans-serif" font-weight="700" font-size="{10 if len(word) > 9 else 12.5}" letter-spacing="2" fill="{ink}">{word}</text></svg>')


def passport(p):
    css = """
.fr-pass .fr-wrap{display:grid;gap:22px;align-items:center;padding:26px 22px;border-radius:22px;background:var(--cream);
  background-image:repeating-linear-gradient(0deg,transparent 0 34px,rgba(52,99,175,.06) 34px 35px)}
.fr-pass h3{font-size:clamp(21px,3.6cqw,28px);color:var(--ink)}
.fr-pass h3 span{white-space:nowrap}
.fr-pass .fr-copy p{margin-top:10px;max-width:40ch;opacity:.85}
.fr-pass .fr-book{position:relative;width:100%;max-width:440px;aspect-ratio:1.42;justify-self:center;container-type:inline-size}
.fr-pass .fr-pg{position:absolute;top:0;bottom:0;width:50%;padding:5.5cqw 4.5cqw;background:linear-gradient(135deg,#fff8ea,#f1e3c6);color:#22253a;overflow:hidden}
.fr-pass .fr-pg--l{left:0;border-radius:2.6cqw 0 0 2.6cqw;box-shadow:inset -2.6cqw 0 3.8cqw rgba(0,0,0,.12),0 3.8cqw 9cqw rgba(10,12,30,.3)}
.fr-pass .fr-pg--r{right:0;border-radius:0 2.6cqw 2.6cqw 0;box-shadow:inset 2.6cqw 0 3.8cqw rgba(0,0,0,.12),0 3.8cqw 9cqw rgba(10,12,30,.3)}
.fr-pass .fr-pg small{display:block;font:700 1.7cqw/1 'Geist',sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#5a5f86}
.fr-pass .fr-pg strong{display:block;margin-top:1.6cqw;font:800 4.6cqw/1 'Unbounded',sans-serif;letter-spacing:-.04em}
.fr-pass .fr-pg--l span{display:block;margin-top:2.4cqw;font:400 2.3cqw/1.55 'Geist',sans-serif;color:#4a4f72}
.fr-pass .fr-mrz{position:absolute;left:4cqw;right:2cqw;bottom:4cqw;font:400 1.55cqw/1.6 'Geist Mono',monospace;color:#6a6f95;white-space:nowrap;overflow:hidden}
.fr-pass .fr-slots{position:absolute;inset:6% 7%;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,1fr);gap:4% 6%}
.fr-pass .fr-slot{position:relative;aspect-ratio:1;height:100%;justify-self:center}
.fr-pass .fr-slot svg{position:absolute;inset:-6%;width:112%;height:112%;opacity:.9;transform:rotate(var(--r));mix-blend-mode:multiply}
.fr-pass .fr-slot--title{aspect-ratio:auto;justify-self:stretch;display:flex;flex-direction:column;justify-content:center}
.fr-pass .fr-slot--title strong{margin:0;font-size:3.6cqw}
.fr-pass .fr-slot--title span{margin-top:1cqw;font:400 2cqw/1.35 'Geist',sans-serif;color:#4a4f72}
.fr-pass .fr-rubber{position:absolute;right:-2%;top:-26%;width:10%;transform:rotate(14deg)}
@container (min-width:620px){
  .fr-pass .fr-wrap{grid-template-columns:1fr 1.15fr;padding:30px}
}
"""
    stamps = ''.join(f'<div class="fr-slot" style="--r:{r}deg">{stamp_svg(k, w, ink, f"fr-s-{p["slug"][-8:]}-{k}")}</div>' for k, w, ink, r in STAMP_INK)
    body = f"""
<section class="fr fr-pass">
  <div class="fr-wrap">
    <div class="fr-copy">
      <h3 class="fr-d">On completing Futuready, you get an <span>e-passport.</span></h3>
      <p>Five stamps, one for every level you clear. Sign it on your phone, save it to your photos, and show it off.</p>
    </div>
    <div class="fr-book" role="img" aria-label="An open Futuready passport with all five stamps">
      <div class="fr-pg fr-pg--l"><small>Futuready Passport</small><strong>Builders Lab</strong>
        <span>Holder: You<br>Issued by: Vivek Advani<br>Embassy: Hack2skill<br>Valid: from today, till life</span>
        <div class="fr-mrz">P&lt;FUTUREADY&lt;&lt;BUILDERS&lt;LAB&lt;&lt;&lt;&lt;&lt;&lt;<br>R&lt;E&lt;A&lt;D&lt;Y&lt;&lt;HACK2SKILL&lt;&lt;&lt;&lt;&lt;2031</div></div>
      <div class="fr-pg fr-pg--r"><div class="fr-slots"><div class="fr-slot fr-slot--title"><strong>Stamps</strong><span>One for every level you clear.</span></div>{stamps}</div></div>
      <img class="fr-rubber fr-cut" src="{IMG['stamp']}" alt="" loading="lazy">
    </div>
  </div>
</section>"""
    return section('Your e-passport', css, body)


# ---------------------------------------------------------------- 4. the day
def theday(p):
    css = """
.fr-day .fr-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
.fr-day h3{font-size:clamp(22px,5cqw,30px)}
.fr-day .fr-head p{margin-top:8px;opacity:.8;max-width:34ch}
.fr-day .fr-steps{margin-top:20px;display:grid;gap:0;border-left:2px dashed rgba(22,26,58,.2);margin-left:8px}
.fr-day .fr-step{position:relative;padding:0 0 20px 24px}
.fr-day .fr-step::before{content:'';position:absolute;left:-8px;top:4px;width:14px;height:14px;border-radius:50%;background:var(--blue);box-shadow:0 0 0 4px #fff}
.fr-day .fr-step:last-child{padding-bottom:0}
.fr-day .fr-step:last-child::before{background:var(--marigold)}
.fr-day .fr-step small{font-size:12px;opacity:.65}
.fr-day .fr-step strong{display:block;margin-top:2px;font:600 18px/1.25 'Geist',sans-serif;letter-spacing:-.02em}
.fr-day .fr-step span{display:block;margin-top:2px;opacity:.8}
"""
    steps = ''.join(f'<li class="fr-step"><small class="fr-mono">{t}</small><strong>{html.escape(a)}</strong><span>{html.escape(b)}</span></li>' for t, a, b in p['day_steps'])
    body = f"""
<section class="fr fr-day">
  <div class="fr-head">
    <div><h3 class="fr-d">{html.escape(p['day_title'])}</h3><p>{html.escape(p['date'])} · {html.escape(p['where'])}</p></div>
  </div>
  <ol class="fr-steps">{steps}</ol>
</section>"""
    return section('The day', css, body)


# ---------------------------------------------------------------- 5. trainer
def trainer(p):
    css = """
.fr-trainer .fr-card{position:relative;overflow:hidden;border-radius:22px;background:var(--night);color:var(--cream);padding:26px 22px 0;min-height:520px}
.fr-trainer .fr-card::before{content:'';position:absolute;inset:0;opacity:.5;background:
  radial-gradient(circle at 70% 60%,transparent 0 120px,rgba(179,157,255,.18) 121px 122px,transparent 123px 170px,rgba(179,157,255,.14) 171px 172px,transparent 173px)}
.fr-trainer .fr-eyebrow{position:relative;font-size:12px;letter-spacing:.14em;text-transform:uppercase;opacity:.85}
.fr-trainer h3{position:relative;margin-top:8px;font-size:clamp(30px,7cqw,44px);color:var(--marigold)}
.fr-trainer .fr-links{position:relative;display:flex;gap:18px;margin-top:10px}
.fr-trainer .fr-links a{display:inline-flex;align-items:center;min-height:40px;font:600 13px/1 'Geist Mono',monospace;text-underline-offset:4px}
.fr-trainer .fr-floor{position:absolute;left:0;right:0;bottom:0;height:70px;background:#2c2058}
.fr-trainer .fr-photo{position:absolute;left:50%;bottom:22px;height:330px;width:auto;transform:translateX(-50%)}
.fr-trainer .fr-tapes{position:absolute;left:0;right:0;bottom:60px;top:190px}
.fr-trainer .fr-tape{position:absolute;max-width:150px;padding:6px 10px 5px;border-radius:2px;font:700 11px/1.3 'Geist Mono',monospace;letter-spacing:.09em;
  text-transform:uppercase;color:#fffcf5;box-shadow:0 6px 14px rgba(0,0,0,.3);text-shadow:0 -1px 0 rgba(0,0,0,.35)}
.fr-trainer .fr-tape--light{color:#161a3a;text-shadow:0 1px 0 rgba(255,255,255,.4)}
@container (min-width:620px){
  .fr-trainer .fr-card{min-height:470px;padding:34px}
  .fr-trainer .fr-photo{left:66%;height:380px}
  .fr-trainer .fr-tapes{left:30%;top:150px}
  .fr-trainer .fr-tape{max-width:220px}
}
"""
    colors = [('#fffcf5', True), ('#c8312f', False), ('#1a6fc0', False), ('#f2b230', True)]
    spots = ['left:8%;top:0%', 'right:8%;top:12%', 'left:6%;top:26%', 'right:6%;top:40%', 'left:10%;top:54%', 'right:10%;top:68%', 'left:8%;top:82%']
    rot = [-3, 2.5, -2, 3, -2.5, 2, -1.5]
    tapes = ''
    for j, txt in enumerate(LABELS):
        bg, light = colors[j % 4]
        tapes += f'<span class="fr-tape{" fr-tape--light" if light else ""}" style="{spots[j]};background:{bg};transform:rotate({rot[j]}deg)">{html.escape(txt)}</span>'
    body = f"""
<section class="fr fr-trainer">
  <div class="fr-card">
    <p class="fr-mono fr-eyebrow">Meet your trainer</p>
    <h3 class="fr-d">Vivek Advani</h3>
    <p class="fr-links"><a href="https://www.linkedin.com/in/vivekadvani" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a><a href="https://instagram.com/vivekadvani" target="_blank" rel="noopener noreferrer">Instagram ↗</a></p>
    <div class="fr-floor" aria-hidden="true"></div>
    <img class="fr-photo fr-cut" src="{IMG['vivek']}" alt="Vivek Advani, your trainer" loading="lazy">
    <div class="fr-tapes">{tapes}</div>
  </div>
</section>"""
    return section('Meet your trainer', css, body)


# ---------------------------------------------------------------- 6. voices
def voices(p):
    css = """
.fr-voices .fr-wall{display:grid;gap:22px;padding:30px 18px 22px;border-radius:22px;background:var(--cream)}
.fr-voices .fr-paper{position:relative;padding:18px 18px 15px;border-radius:4px;background:var(--paper);box-shadow:0 1px 0 rgba(0,0,0,.05),0 12px 26px rgba(10,12,30,.14);transform:rotate(var(--r))}
.fr-voices .fr-paper::before{content:'';position:absolute;top:-9px;left:50%;width:64px;height:18px;transform:translateX(-50%) rotate(-3deg);background:rgba(242,178,48,.6)}
.fr-voices blockquote{font:500 17px/1.42 'Geist',sans-serif;letter-spacing:-.012em;text-wrap:pretty}
.fr-voices figcaption{margin-top:10px;font:650 14px/1.3 'Geist',sans-serif}
.fr-voices figcaption span{display:block;margin-top:1px;font:400 12px/1.3 'Geist Mono',monospace;opacity:.7}
@container (min-width:620px){ .fr-voices .fr-wall{grid-template-columns:repeat(3,1fr);padding:34px 26px 26px} }
"""
    rots = [-2.5, 2, -1.5]
    papers = ''.join(f'<figure class="fr-paper" style="--r:{rots[i]}deg"><blockquote>“{html.escape(q)}”</blockquote><figcaption>{html.escape(n)}<span>{html.escape(r)}</span></figcaption></figure>' for i, (q, n, r) in enumerate(QUOTES))
    body = f'<section class="fr fr-voices"><div class="fr-wall">{papers}</div></section>'
    return section('What Futuready attendees say', css, body)


# ---------------------------------------------------------------- 7. faqs + the last call
def faqs(p):
    css = """
.fr-faq details{border-bottom:1px solid rgba(22,26,58,.12)}
.fr-faq summary{display:flex;justify-content:space-between;align-items:center;gap:16px;min-height:56px;cursor:pointer;list-style:none;
  font:600 17px/1.3 'Geist',sans-serif;letter-spacing:-.02em}
.fr-faq summary::-webkit-details-marker{display:none}
.fr-faq summary::after{content:'+';flex:none;width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:var(--cream);font:500 20px/1 'Geist',sans-serif;transition:transform .3s}
.fr-faq details[open] summary::after{transform:rotate(45deg)}
.fr-faq details p{padding:0 0 18px;max-width:60ch;opacity:.85}
.fr-faq .fr-last{position:relative;overflow:hidden;margin-top:26px;padding:26px 22px 0;border-radius:22px;background:var(--blue);color:var(--cream);min-height:330px}
.fr-faq .fr-last h3{font-size:clamp(24px,5.4cqw,34px);color:var(--cream);max-width:14ch}
.fr-faq .fr-last h3 em{font-style:normal;color:var(--marigold)}
.fr-faq .fr-last .fr-btn{margin-top:18px}
.fr-faq .fr-last .fr-note{margin-top:12px;color:var(--cream)}
.fr-faq .fr-last .fr-note a{text-underline-offset:3px}
.fr-faq .fr-floor{position:absolute;left:0;right:0;bottom:0;height:60px;background:var(--cream)}
.fr-faq .fr-last img{position:absolute;bottom:18px}
.fr-faq .fr-wave{right:96px;height:170px}
.fr-faq .fr-bot{right:22px;height:120px}
@container (max-width:460px){ .fr-faq .fr-last{min-height:420px} .fr-faq .fr-wave{right:auto;left:30%} .fr-faq .fr-bot{right:auto;left:60%} }
"""
    q = [
        ('Who can attend?', p['who']),
        ('Do I need to pay?', 'No. Futuready is free for students.'),
        p['where_faq'],
        ('Do I need a laptop?', p['need_laptop']),
        ('Do I need to know AI already?', 'No. If you have used any AI chatbot even once, you are ready. If you have used none, you will leave having built something with one.'),
        ('What should I bring?', p['bring']),
        ('Why register?', p['why_register']),
        ('How do I bring Futuready to my college?', 'Ask your Training and Placement cell or your tech club to write to support@hack2skill.com.'),
    ]
    items = ''.join(f'<details><summary>{html.escape(a)}</summary><p>{html.escape(b)}</p></details>' for a, b in q)
    body = f"""
<section class="fr fr-faq">
  {items}
  <div class="fr-last">
    <h3 class="fr-d">See you at <em>Futuready.</em></h3>
    <a class="fr-btn fr-btn--y" href="{reg(p)}">Register free</a>
    <p class="fr-note">Free · {html.escape(p['date'])} · {html.escape(p['where'])}</p>
    <div class="fr-floor" aria-hidden="true"></div>
    <img class="fr-cut fr-wave" src="{IMG['boyWave']}" alt="" loading="lazy">
    <img class="fr-cut fr-bot" src="{IMG['botWave']}" alt="" loading="lazy">
  </div>
</section>"""
    return section('FAQs', css, body)


SECTIONS = [('01-about', 'About', about), ('02-learn', 'What you will learn', levels), ('03-passport', 'Your e-passport', passport),
            ('04-day', 'The day', theday), ('05-trainer', 'Meet your trainer', trainer), ('06-voices', 'What attendees say', voices),
            ('07-faqs', 'FAQs', faqs)]

if __name__ == '__main__':
    for key, p in PAGES.items():
        out = HERE / 'out' / key
        out.mkdir(parents=True, exist_ok=True)
        blocks = []
        for fname, title, fn in SECTIONS:
            h = fn(p)
            (out / f'{fname}.html').write_text(h)
            blocks.append((title, h))
        # a local stand-in for the Hack2skill page column, at laptop and phone widths
        prev = ''.join(f'<h2 class="h2s-title">{html.escape(t)}</h2>{h}' for t, h in blocks)
        (out / 'preview.html').write_text(f"""<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{{margin:0;background:#fff;font-family:Nunito,system-ui,sans-serif}}.col{{max-width:730px;margin:0 auto;padding:24px 16px 60px}}
.h2s-title{{font:700 24px/1.2 Nunito,system-ui,sans-serif;color:#0f172a;margin:44px 0 16px}}</style></head>
<body><div class="col">{prev}</div></body></html>""")
        print(key, [len(b[1]) for b in blocks])

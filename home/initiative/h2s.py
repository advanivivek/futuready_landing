"""
Futuready pages on Hack2skill: the text you paste into each section of the page, made from one template.

    python3 home/initiative/h2s.py      -> writes home/initiative/out/<page>/h2s/

Hack2skill's section editor keeps text colours, text sizes, bold, links, pictures and the background colour of
table cells. It drops stylesheets, boxes and web fonts. So every section here is built only from those parts:
coloured tables for cards, pictures for the passport and the last call (made by shoot.mjs from the designed
sections in build.py), and plain text for everything else.

The page leads with what a student needs, then gets out of the way: what it is, the facts, register.
Each section says its point first (what you learn, when, who teaches) and the colour after.

How to paste a file: Live Edit > the section > Insert > Source Code > paste the whole file > Embed > Save.
The FAQs go in the built-in FAQs section, one by one (faqs.txt).

To make a new city: copy a PAGES entry in build.py, change its details, run this again.
"""
import html
from pathlib import Path

from build import IMG, LEVELS, PAGES, QUOTES, reg

HERE = Path(__file__).parent
INK, BLUE, GOLD, PAPER, CREAM = '#161a3a', '#3463af', '#f2b230', '#fffcf5', '#efe6d2'
LINKEDIN, INSTAGRAM = 'https://www.linkedin.com/in/vivekadvani', 'https://instagram.com/vivekadvani'


def s(text, size=17, weight=None, color=INK):
    """A piece of text with its own size, weight and colour (the only styling the editor keeps)."""
    style = f'font-size:{size}px;' + (f'font-weight:{weight};' if weight else '') + f'color:{color}'
    return f'<span style="{style}">{html.escape(text)}</span>'


def p_(*parts, center=False):
    return f'<p{" style=\"text-align:center\"" if center else ""}>{"".join(parts)}</p>'


def button(href, label, bg=GOLD, fg=INK):
    """A button made of one coloured table cell. Hack2skill's own CTA button turns back into a plain link
    whenever its section is opened and saved again, so this sturdier one is used instead."""
    return buttons((href, label, bg, fg))


def buttons(*specs):
    cells = ''.join(f'<td style="background-color:{bg}"><p><a href="{href}">{s(label, 18, 800, fg)}</a></p></td>' for href, label, bg, fg in specs)
    return f'<table><tbody><tr>{cells}</tr></tbody></table>'


def register(p):
    return button(reg(p), 'Register free  →')


# ---------------------------------------------------------------- About (the built-in About box, always first)
def about(p):
    facts = ''.join(f'<tr><td style="background-color:{CREAM}"><p>{s(k.upper(), 13, 800, BLUE)}</p></td>'
                    f'<td style="background-color:{PAPER}"><p>{s(v, 17, 700)}</p></td></tr>' for k, v in p['facts'])
    partner = ''
    if p['partner']:
        partner = (p_(s('Campus Organising Partner: ', 15, 800, BLUE), s('Parul University', 15, 800))
                   + f'<p><img src="{IMG["parulUniversity"]}" alt="Parul University" width="220" height="61"></p>'
                   + f'<p><img src="{IMG["puAiSociety"]}" alt="The PU AI Society" width="180" height="49"></p>')
    return (p_(s('A free, hands-on AI bootcamp for college students.', 22, 800))
            + p_(s('Not a lecture. You play live on your phone through five levels, build with AI, and leave with an e-passport.', 17))
            + f'<table><tbody>{facts}</tbody></table><p><br></p>'
            + register(p)
            + partner + '\n')


# ---------------------------------------------------------------- What you will learn (+ the e-passport)
def learn(p):
    rows = ''
    for k, lv, name, say, learn_, wall, tint, fg in LEVELS:
        what = ' '.join(learn_).rstrip('.') + '.'
        hook = ' '.join(say).replace('right, Is', 'right, is')
        rows += (f'<tr><td style="background-color:{wall}"><p style="text-align:center">{s(k, 40, 800)}</p></td>'
                 f'<td style="background-color:{PAPER}"><p>{s(what.replace("AI Agents", "AI agents"), 19, 800)}</p>'
                 f'<p>{s(hook, 16, None, BLUE)}</p></td></tr>')
    rows += (f'<tr><td style="background-color:{BLUE}"><p style="text-align:center">{s("Y", 40, 800, GOLD)}</p></td>'
             f'<td style="background-color:{BLUE}"><p>{s("And the last level is ", 19, 800, PAPER)}{s("you.", 19, 800, GOLD)}</p>'
             f'<p>{s("The unique part that nobody can steal.", 16, None, CREAM)}</p></td></tr>')
    return (p_(s('Five levels. Clear one, earn a stamp.', 18, 800))
            + f'<table><tbody>{rows}</tbody></table>'
            + p_(s('Clear all five, and you take home your ', 19, 800), s('e-passport.', 19, 800, BLUE))
            + f'<p><img src="{IMG["passportBlock"]}" alt="An open Futuready passport with all five stamps" width="640" height="493"></p>\n')


# ---------------------------------------------------------------- Schedule
def schedule(p):
    rows = ''
    for t, a, b in p['schedule']:
        detail = f'<p>{s(b, 15)}</p>' if b else ''
        rows += (f'<tr><td style="background-color:{GOLD}"><p>{s(t, 15, 800)}</p></td>'
                 f'<td style="background-color:{PAPER}"><p>{s(a, 18, 800)}</p>{detail}</td></tr>')
    head = p_(s(p['facts'][0][1] + ' · ' + p['where'], 17, 800, BLUE)) if p['weekday'] else ''
    return head + f'<table><tbody>{rows}</tbody></table>' + p_(s(p['schedule_note'], 15)) + '\n'


# ---------------------------------------------------------------- Meet your trainer
def trainer(p):
    links = buttons((LINKEDIN, 'LinkedIn  ↗', BLUE, PAPER), (INSTAGRAM, 'Instagram  ↗', GOLD, INK))
    return (f'<p><img src="{IMG["portrait"]}" alt="Vivek Advani" width="300" height="375"></p>'
            + p_(s('Vivek Advani', 24, 800))
            + p_(s('DevRel at Hack2skill. An architect who builds AI products, and loves math, salsa and music.', 17))
            + p_(s('Follow him, or look him up:', 15, 700, BLUE))
            + links + '\n')


# ---------------------------------------------------------------- What students say, and the last call
def voices(p):
    tints = ['#fdeef1', '#eaf6f0', '#fff4dc']
    rows = ''.join(f'<tr><td style="background-color:{tints[i]}"><p>{s("“" + q + "”", 18, 600)}</p>'
                   f'<p>{s(n, 15, 800, BLUE)}{s("  ·  " + r, 15)}</p></td></tr>' for i, (q, n, r) in enumerate(QUOTES))
    when = 'Free · ' + p['date'] + ' · ' + p['where'] if p['weekday'] else 'Free · Online · Register once for every session'
    return (p_(s('Students who attended Futuready in Pune, in their own words on LinkedIn.', 16, 700, BLUE))
            + f'<table><tbody>{rows}</tbody></table>'
            + f'<p><img src="{IMG["lastCallBlock"]}" alt="See you at Futuready" width="640" height="300"></p>'
            + register(p)
            + p_(s(when, 15, 700)) + '\n')


# ---------------------------------------------------------------- FAQs (the built-in FAQs section)
def faqs(p):
    return [
        ('Who can attend?', p['who']),
        ('Is it free?', 'Yes. Futuready is free for students.'),
        p['where_faq'],
        ('Do I need a laptop?', p['need_laptop']),
        ('Do I need to know AI already?', 'No. If you have used any AI chatbot even once, you are ready. If you have used none, you will leave having built something with one.'),
        ('What should I bring?', p['bring']),
        ('Why register?', p['why_register']),
        ('How do I bring Futuready to my college?', 'Ask your Training and Placement cell or your tech club to write to support@hack2skill.com.'),
    ]


# ---------------------------------------------------------------- the welcome email (Timeline > Registration > Communication)
def email(p):
    """Subject and HTML body for the 'Registered for an Event' email. @name and @eventUrl are Hack2skill's own tags."""
    facts = ''.join(f'<tr><td style="padding:10px 14px;background:{CREAM};font:800 12px/1.3 Arial,sans-serif;letter-spacing:1px;color:{BLUE}">{k.upper()}</td>'
                    f'<td style="padding:10px 14px;background:{PAPER};font:700 15px/1.4 Arial,sans-serif;color:{INK}">{html.escape(v)}</td></tr>'
                    for k, v in p['facts'] if k not in ('Entry', 'For'))
    cal = ''
    if p.get('calendar'):
        start, end = p['calendar']
        q = (f"action=TEMPLATE&text=Futuready%20by%20H2S&dates={start}/{end}"
             f"&location={p['where'].replace(' ', '%20').replace(',', '%2C')}&details=Bring%20a%20charged%20phone.")
        cal = (f'<p style="margin:18px 0 0"><a href="https://calendar.google.com/calendar/render?{q}" '
               f'style="display:inline-block;padding:12px 20px;border-radius:999px;background:{GOLD};color:{INK};font:800 15px Arial,sans-serif;text-decoration:none">Add to Google Calendar</a></p>')
    subject = f"You're in: Futuready by H2S, {p['date']}" if p['weekday'] else "You're in: Futuready by H2S, Virtual edition"
    body = f"""<div style="max-width:560px;margin:0 auto;font:400 15px/1.6 Arial,sans-serif;color:{INK}">
<p style="margin:0 0 6px;font:800 13px Arial,sans-serif;letter-spacing:3px;color:{BLUE}">FUTUREADY BY H2S</p>
<p style="margin:0 0 14px;font:800 24px/1.25 Arial,sans-serif;color:{INK}">You're in, @name.</p>
<p style="margin:0 0 16px">Your registration for Futuready is confirmed. Here is everything you need:</p>
<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%">{facts}</table>
{cal}
<p style="margin:20px 0 6px;font-weight:800">Bring</p>
<p style="margin:0">{html.escape(p['bring'])}</p>
<p style="margin:20px 0 0">{html.escape(p.get('email_note', p['schedule_note']))} The page has the full schedule: <a href="@eventUrl" style="color:{BLUE};font-weight:700">@eventUrl</a></p>
<p style="margin:20px 0 0">See you there,<br>Vivek and Team Hack2skill</p>
</div>"""
    return subject, body


# file name, section title on the page, maker. 00 goes in About; the rest are custom sections, in this order.
SECTIONS = [
    ('00-about', 'About', about),
    ('01-learn', 'What you will learn', learn),
    ('02-schedule', None, schedule),  # titled with the page's day_title
    ('03-trainer', 'Meet your trainer', trainer),
    ('04-voices', 'What students say', voices),
]

if __name__ == '__main__':
    for key, p in PAGES.items():
        out = HERE / 'out' / key / 'h2s'
        for old in out.glob('*'):
            old.unlink()
        out.mkdir(parents=True, exist_ok=True)
        order = []
        for fname, title, fn in SECTIONS:
            (out / f'{fname}.html').write_text(fn(p))
            order.append(f'{fname}.html  ->  {title or p["day_title"]}')
        subject, body = email(p)
        (out / 'email.html').write_text(body)
        (out / 'email-subject.txt').write_text(subject + '\n')
        (out / 'faqs.txt').write_text(''.join(f'Q: {q}\nA: {a}\n\n' for q, a in faqs(p)))
        (out / 'ORDER.txt').write_text('Paste in this order (the file, then the section title on the page):\n\n' + '\n'.join(order)
                                       + '\nfaqs.txt  ->  FAQs (built-in section, one question at a time)'
                                       + '\nemail-subject.txt + email.html  ->  Timeline > Registration > Communication > Configure > Embed HTML\n')
        # a rough local look at the pasted sections (the real page uses Hack2skill's own fonts and table borders)
        body = ''.join(f'<h2>{html.escape(t or p["day_title"])}</h2>' + fn(p) for _, t, fn in SECTIONS)
        body += '<h2>FAQs</h2>' + ''.join(f'<p><strong>{html.escape(q)}</strong><br>{html.escape(a)}</p>' for q, a in faqs(p))
        (out / 'preview.html').write_text(f"""<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{{margin:0;font-family:Nunito,system-ui,sans-serif;color:#475467}}.c{{max-width:730px;margin:0 auto;padding:20px 16px 60px}}
h2{{font-size:24px;color:#0f172a;margin:40px 0 14px}}table{{border-collapse:collapse;margin:8px 0}}td{{border:1px solid #bbb;padding:6px 8px;vertical-align:top}}
p{{margin:0 0 6px}}img{{max-width:100%;height:auto}}a{{text-decoration:none}}</style><div class="c">{body}</div>""")
        print(key, 'ok')

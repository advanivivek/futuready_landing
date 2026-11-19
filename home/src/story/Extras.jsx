import { useEffect, useId, useRef, useState } from 'react';
import { BRING_FORM_URL, LEVELS, SHARE_TEXT, SITE_URL, SUPPORT } from '../data';
import { sound } from './sound';

const BASE = import.meta.env.BASE_URL;
export const pageUrl = () => SITE_URL || new URL(BASE, location.href).href;

/* ---------- sharing ---------- */
// The phone's own share sheet where there is one (the visitor never leaves the page); otherwise a small
// menu: copy the link, or open WhatsApp / LinkedIn / X / email in a new tab.
// the share symbol everyone knows: three dots joined by two lines
export const ShareIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="17.6" cy="5.4" r="3.4" fill="currentColor" stroke="none" />
    <circle cx="6.2" cy="12" r="3.4" fill="currentColor" stroke="none" />
    <circle cx="17.6" cy="18.6" r="3.4" fill="currentColor" stroke="none" />
    <path d="m8.8 10.5 6.2-3.6M8.8 13.5l6.2 3.6" />
  </svg>
);

export function ShareButton({ label, text = SHARE_TEXT, url, className = '', icon = 16, iconOnly = false }) {
  const id = useId();
  const menu = useRef(null);
  const btn = useRef(null);
  const tip = useRef(null);
  const timer = useRef(0);
  const link = url || pageUrl();

  const open = async () => {
    sound.play('click');
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Futuready', text, url: link });
        sound.play('chime');
        return;
      } catch (e) {
        if (e?.name === 'AbortError') return;
      }
    }
    const m = menu.current;
    if (!m?.showPopover) return copy();
    // sit just above (or below) the button
    const r = btn.current.getBoundingClientRect();
    m.style.left = `${Math.min(Math.max(12, r.left + r.width / 2 - 120), innerWidth - 252)}px`;
    m.style.right = 'auto';
    m.style.top = r.top > 260 ? `${r.top - 8}px` : `${r.bottom + 8}px`;
    m.style.translate = r.top > 260 ? '0 -100%' : '0 0';
    m.togglePopover();
  };

  const copy = async () => {
    let ok = true;
    try {
      await navigator.clipboard.writeText(`${text} ${link}`);
    } catch {
      ok = false;
    }
    clearTimeout(timer.current);
    tip.current.textContent = '';
    requestAnimationFrame(() => (tip.current.textContent = ok ? 'Link copied. Paste it anywhere.' : 'Could not copy. The link is ' + link));
    timer.current = setTimeout(() => tip.current && (tip.current.textContent = ''), 2600);
    if (ok) sound.play('pop');
  };

  const q = encodeURIComponent;
  const targets = [
    ['WhatsApp', `https://wa.me/?text=${q(`${text} ${link}`)}`],
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${q(link)}`],
    ['X', `https://x.com/intent/post?text=${q(text)}&url=${q(link)}`],
    ['Email', `mailto:?subject=${q('Futuready')}&body=${q(`${text}\n\n${link}`)}`],
  ];
  return (
    <span className={`share ${className}`}>
      <button ref={btn} type="button" className="share__btn" onClick={open} aria-label={iconOnly ? label : undefined}>
        <ShareIcon size={icon} />
        {iconOnly ? null : label}
      </button>
      <span ref={tip} className="share__tip" role="status" />
      <span ref={menu} id={id} className="share__menu" popover="auto">
        <button type="button" onClick={copy}>
          Copy link
        </button>
        {targets.map(([name, href]) => (
          <a key={name} href={href} target="_blank" rel="noopener noreferrer" onClick={() => menu.current?.hidePopover?.()}>
            {name}
          </a>
        ))}
      </span>
    </span>
  );
}

/* ---------- "Bring it to your campus" ---------- */
const ROLES = ['Student', 'Faculty', 'Management', 'Club lead', 'Other'];
const CONFETTI = Array.from({ length: 26 }, (_, i) => ({
  x: Math.cos((i / 26) * Math.PI * 2) * (60 + (i % 5) * 18),
  y: Math.sin((i / 26) * Math.PI * 2) * (40 + (i % 4) * 16) - 30,
  c: LEVELS[i % 5].color,
  r: (i * 47) % 360,
}));

function Field({ id, label, hint, error, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {hint ? <i> {hint}</i> : null}
      </label>
      {children}
      <span className="field__error" id={`${id}-err`}>
        {error}
      </span>
    </div>
  );
}

export function BringDialog({ open, city: presetCity = '', onClose }) {
  const ref = useRef(null);
  const form = useRef(null);
  const [step, setStep] = useState(1);
  const [college, setCollege] = useState('');
  const [city, setCity] = useState('');
  const [role, setRole] = useState('Student');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [failed, setFailed] = useState('');

  useEffect(() => {
    const d = ref.current;
    if (open && !d.open) {
      setDone(null);
      setFailed('');
      setStep(1);
      form.current?.reset();
      setCollege('');
      setCity(presetCity);
      setRole('Student');
      d.showModal();
      // laptops start typing straight away; phones keep the keyboard down until a field is tapped
      if (matchMedia('(pointer: fine)').matches) d.querySelector('#bf-college')?.focus();
      else d.querySelector('#bring-h')?.focus();
      sound.play('whoosh');
    }
    if (!open && d.open) d.close();
  }, [open, presetCity]);

  // light dismiss where <dialog closedby="any"> is not supported yet (Safari)
  useEffect(() => {
    const d = ref.current;
    if ('closedBy' in HTMLDialogElement.prototype) return;
    const outside = e => {
      const r = d.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    let down = false;
    const pd = e => (down = outside(e));
    const pu = e => down && outside(e) && d.close();
    d.addEventListener('pointerdown', pd);
    d.addEventListener('pointerup', pu);
    return () => {
      d.removeEventListener('pointerdown', pd);
      d.removeEventListener('pointerup', pu);
    };
  }, []);

  // errors show once a field has been left (or on Next / Send), and clear as soon as it is fixed
  const check = el => {
    const bad = !el.validity.valid;
    el.setAttribute('aria-invalid', bad ? 'true' : 'false');
    if (bad) el.setAttribute('aria-describedby', `${el.id}-err`);
    else el.removeAttribute('aria-describedby');
    el.closest('.field')?.classList.toggle('is-bad', bad);
    return !bad;
  };
  const onBlur = e => e.target.matches('input:not([type=radio])') && e.target.value && check(e.target);
  const onInput = e => e.target.matches('input') && e.target.closest('.is-bad') && check(e.target);
  // checks one step's fields; the first problem gets the focus
  const valid = n => {
    const inputs = [...form.current.querySelectorAll(`[data-step="${n}"] input:not([type=radio])`)];
    const ok = inputs.map(check);
    const first = inputs[ok.indexOf(false)];
    first?.focus();
    return !first;
  };

  const next = () => {
    if (!valid(1)) return;
    setStep(2);
    sound.play('page');
    requestAnimationFrame(() => (matchMedia('(pointer: fine)').matches ? form.current.querySelector('#bf-email') : ref.current.querySelector('#bring-h'))?.focus());
  };

  const submit = async e => {
    e.preventDefault();
    if (step === 1) return next();
    if (!valid(2)) return;
    const data = Object.fromEntries(new FormData(form.current));
    data.page = location.href;
    setBusy(true);
    setFailed('');
    try {
      if (BRING_FORM_URL) {
        const res = await fetch(BRING_FORM_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) });
        const out = await res.json().catch(() => ({ ok: res.ok }));
        if (out.ok === false) throw new Error(out.error || 'failed');
      } else {
        // not connected to the Google Sheet yet: hand the request to their email app instead
        const body = ['College: ' + data.college, 'City: ' + data.city, 'Name: ' + data.name, 'I am: ' + data.role, 'Email: ' + data.email, 'Phone: ' + (data.phone || '')].join('\n');
        location.href = `mailto:${SUPPORT}?subject=${encodeURIComponent(`Bring Futuready to ${data.college}, ${data.city}`)}&body=${encodeURIComponent(body)}`;
      }
      setDone({ ...data, first: String(data.name).trim().split(/\s+/)[0], mail: !BRING_FORM_URL });
      sound.play('thunk');
      setTimeout(() => sound.play('chime'), 380);
      try {
        navigator.vibrate?.([14, 40, 24]);
      } catch {
        /* no haptics */
      }
      requestAnimationFrame(() => ref.current.querySelector('#bring-h')?.focus());
    } catch {
      setFailed('That did not go through. Please check your connection and try again.');
    }
    setBusy(false);
  };

  const board = (done ? done.college : college).trim() || 'Your college';
  return (
    <dialog
      ref={ref}
      className="sheet bring"
      closedby="any"
      aria-labelledby="bring-h"
      onClose={onClose}
    >
      <form method="dialog" className="sheet__close">
        <button aria-label="Close">×</button>
      </form>
      <div className={`bring__coach ${done ? 'is-done' : ''}`} aria-hidden="true">
        <img src={`${BASE}story/coach.webp`} alt="" />
        <span className="bring__board" style={{ fontSize: `min(8.4cqh, ${(124 / (Math.max(8, board.length) * 0.72)).toFixed(2)}cqh)` }}>
          {board}
        </span>
        {done ? (
          <>
            <img className="bring__stamp" src={`${BASE}story/stamp.webp`} alt="" />
            <span className="bring__mark">REQUESTED</span>
            <span className="bring__confetti">
              {CONFETTI.map((p, i) => (
                <i key={i} style={{ '--x': `${p.x}px`, '--y': `${p.y}px`, '--r': `${p.r}deg`, background: p.c }} />
              ))}
            </span>
          </>
        ) : null}
      </div>

      {done ? (
        <div className="bring__done" role="status">
          <h2 id="bring-h" tabIndex={-1}>
            {done.mail ? 'Almost there.' : 'Request received.'}
          </h2>
          {done.mail ? (
            <p>Your email app has the request ready. Press send, and we will take it from there.</p>
          ) : (
            <p>
              Thank you, {done.first}. We will write to you at <b>{done.email}</b> about bringing Futuready to {done.college}, {done.city}.
            </p>
          )}
          <p className="bring__also">Know someone who would love this?</p>
          <ShareButton label="Share with friends" />
          <form method="dialog">
            <button className="link-btn">Back to the story</button>
          </form>
        </div>
      ) : (
        <form ref={form} className="bring__form" noValidate onSubmit={submit} onBlur={onBlur} onInput={onInput}>
          <h2 id="bring-h" tabIndex={-1}>
            Bring Futuready to your campus
          </h2>
          <ol className="bring__steps" aria-label={`Step ${step} of 2`}>
            <li className={step === 1 ? 'is-on' : ''} aria-hidden="true" />
            <li className={step === 2 ? 'is-on' : ''} aria-hidden="true" />
          </ol>

          <div data-step="1" className="bring__step" hidden={step !== 1}>
            <Field id="bf-college" label="College name" error="Please enter your college name.">
              <input id="bf-college" name="college" required maxLength={140} autoComplete="organization" enterKeyHint="next" value={college} onChange={e => setCollege(e.target.value)} />
            </Field>
            <Field id="bf-city" label="City" error="Please enter the city.">
              <input id="bf-city" name="city" required maxLength={60} autoComplete="address-level2" enterKeyHint="next" value={city} onChange={e => setCity(e.target.value)} />
            </Field>
            <Field id="bf-name" label="Your name" error="Please enter your name.">
              <input id="bf-name" name="name" required maxLength={80} autoComplete="name" enterKeyHint="next" />
            </Field>
            <button type="button" className="pill pill--ink pill--big" onClick={next}>
              Next
            </button>
          </div>

          <div data-step="2" className="bring__step" hidden={step !== 2}>
            <Field id="bf-email" label="Your email" error="Please enter an email like you@college.edu.">
              <input id="bf-email" name="email" type="email" required maxLength={120} autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="next" />
            </Field>
            <fieldset className="chips">
              <legend>You are</legend>
              {ROLES.map(r => (
                <label key={r} className={role === r ? 'is-on' : ''}>
                  <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} />
                  {r}
                </label>
              ))}
            </fieldset>
            <Field id="bf-phone" label="Phone" hint="(optional)" error="Please check the number.">
              <input id="bf-phone" name="phone" type="tel" maxLength={20} autoComplete="tel" inputMode="tel" pattern="[0-9+()\s\-]{7,20}" enterKeyHint="send" />
            </Field>
            {failed ? (
              <p className="bring__failed" role="alert">
                {failed}
              </p>
            ) : null}
            <button type="submit" className="pill pill--ink pill--big" disabled={busy}>
              {busy ? 'Sending…' : 'Request Futuready'}
            </button>
            <button type="button" className="link-btn bring__back" onClick={() => setStep(1)}>
              ← Back
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}

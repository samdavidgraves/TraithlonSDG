# KneesUp Tri

Road to my 1/4 triathlon — a mobile-first training tracker that runs the
**Knee Ability Zero (KAZ)** rehab program alongside a 44-week triathlon build
from **Mon 3 Aug 2026** to **race day, Sun 6 June 2027**, with the arrival of a
first child (due end of Feb 2027) planned in as a real training phase.

Built around a real week: **two weeknights (~45 min) and Sunday (~90 min)** —
about three hours, with KAZ living inside those three slots rather than beside
them. The four non-slot days are rest days, not guilt.

Dark athletic UI, lime accent, big timers, progress rings. React + Tailwind,
everything stored in `localStorage` — single user, no backend, no account.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
npm run preview  # serve the built app (needed to exercise the service worker)
```

## Getting it on your phone

The app is an installable PWA — it precaches its whole shell, so once installed it
opens and logs sessions with no signal (pool changing rooms, turbo sheds, 4am
feeds). Fonts are bundled, so nothing is fetched from the network at runtime.

**Publish it.** Pushing to `main` builds and deploys to GitHub Pages via
`.github/workflows/deploy.yml`. One-time setup: repo **Settings → Pages →
Source: GitHub Actions**. The app then lives at
`https://<user>.github.io/TraithlonSDG/`. Any static host works just as well —
the workflow only sets `VITE_BASE` because project Pages sites are served from a
subpath; on Netlify or Vercel leave it unset and the default `/` applies.

**Install it.**

- *iPhone* — open the URL in **Safari** (not Chrome), Share → **Add to Home
  Screen**. It launches full-screen with no browser chrome.
- *Android* — open in Chrome, menu → **Install app** / **Add to home screen**.

**Back up occasionally.** Sessions are stored in that browser's localStorage and
nowhere else, so clearing site data or switching phones loses them. Settings (⚙)
has *Save backup* / *Copy backup* and *Restore from file* — a JSON round-trip
that also moves your history to a new device. Installing to the home screen makes
eviction much less likely on iOS, but a backup before a phone upgrade is still
worth the ten seconds.

**Just to try it on your phone today**, without publishing: run
`npm run dev -- --host` and open the printed `192.168.x.x:5173` address on a
phone on the same Wi-Fi. Note that the service worker and install prompt need
HTTPS or localhost, so this route gives you the app but not offline mode.

## The three tabs

**Today** — the current phase and week up top, today's sessions below, streak and
week/month counters, and the run-progression gate when it applies. In Phase 3 it
swaps the plan for a menu of micro-sessions.

**Calendar** — all 44 weeks grouped by phase, each week showing its seven days
with a dot per session and completion state. Tap a week to open it, tick sessions
off, or edit it: add your own session, remove one, or reset a day back to the
template.

**History** — every logged session by date with its type, phase, KAZ workout time
and pain check-in; a phase-aware streak, weekly consistency bars, and a KAZ
workout-time trend coloured by how the knees felt.

## KAZ tracker

The 10-step routine, in order, each card carrying its cue and target:

1. Tibialis Raise · 2. FHL Calf Raise · 3. Tibialis Raise (repeat) · 4. KOT Calf
Raise · 5. Patrick Step · 6. ATG Split Squat · 7. Elephant Walk · 8. L-Sit ·
9. Couch Stretch · 10. Piriformis Stretch (figure-4)

Tapping a card opens it and starts that exercise's stopwatch; **DONE** stops it,
logs the time and auto-advances to the next exercise with its clock already
running. A total workout timer runs from the first exercise start to the last
DONE and is saved with the session.

Every session ends with a pain check-in — *Pain-free / Mild discomfort / Stop, it
hurt*. Choosing the last one shows the regression reminder (elevate, shorten the
range, or assist) instead of any suggestion to push through, and it feeds the run
gate below.

## The macrocycle

| Phase | Dates | Weeks | Shape |
| --- | --- | --- | --- |
| 1 — Foundation & Base | 3 Aug – 6 Dec 2026 | 18 | Tue full KAZ · Thu KAZ express + swim · Sun mobility + walk-run (wk 5+) + bike |
| 2 — Taper into Fatherhood | 7 Dec 2026 – 14 Feb 2027 | 10 | Tue KAZ · Thu easy swim · Sun mobility + easy bike (+ optional 15 min jog) |
| 3 — Newborn Survival Mode | 15 Feb – 11 Apr 2027 | 8 | No template — 15–20 min micro-sessions logged ad hoc |
| 4 — Race Build | 12 Apr – 6 Jun 2027 | 8 | Tue KAZ + steady run · Thu race-pace swim · Sun long ride / brick, alternating |

The calendar is counted backwards from race day against two fixed anchors: the
first weekend of June, and the due date at the end of February. Phase 1 is the
18 build weeks; December falls into Phase 2, whose whole purpose — stay ready,
don't build — already suits the holidays and the third trimester.

**The three slots.** `SLOTS` in `src/data/plan.js` defines which days are
training days and how long they are; every template is written per slot, so
moving a night or lengthening the weekend session recuts the whole plan from one
place. Weekly load lands at ~180 min in Phase 1, ~155 in Phase 2, ~170 in
Phase 4 before the taper.

**Walk-run progression (Phase 1).** Running is introduced in week 5 at 1 min run
/ 2 min walk × 7, on the Sunday slot, before the bike so it happens on fresh
legs. It advances one step a week — through 2/2, 3/1, 5/1, 10/1 and 15/1 —
reaching 25 minutes continuous by week 18. Bike time on that slot shrinks as the
run grows, keeping Sunday inside 90 minutes.

**The gate.** Progression only advances while KAZ is going in clean. The app
looks back 14 days at your check-ins:

- any *"stop, it hurt"* → the week's prescription drops back a step and is marked **Held**
- fewer than 2 KAZ check-ins → progression pauses until the knees are proven again
- two or more *"mild discomfort"* → repeat this week's intervals rather than stepping up

**Phase 2** is framed in the UI rather than just scheduled: *"Consistency over
fitness — this phase is about staying injury-free and ready, not building."*
Volume is deliberately low, and the due-date countdown sits in the phase card.

**Phase 3** has no weekly template and no completion percentage. It shows a menu
of micro-sessions — KAZ Express, KAZ Mobility, Knee Strength Mini, pram walk,
short spin, core + L-sit, pool window — that you log whenever a window opens, and
counts *sessions logged* rather than plan adherence. The streak is phase-aware:
quiet days in Survival Mode never break it.

**Phase 4** rebuilds the weeknight run (22 → 30 min) and alternates the Sunday
slot between a long ride and a bike→run brick — four bricks in eight weeks,
which is what one long session a week allows instead of the every-10-days
cadence a bigger week would support. KAZ stays in every week as non-negotiable
maintenance. The final two weeks taper automatically, floored at 15 min so a
taper session is still worth changing kit for.

## Settings

The ⚙ button jumps the app's idea of "today" into any phase, so you can see how
the plan behaves months ahead without waiting — your logs are untouched by it.
The same sheet holds the backup/restore round-trip and a full data reset.

## Layout

```
src/
  data/     kaz.js (the 10 steps), phases.js (macrocycle), plan.js (weekly templates,
            run progression, bricks, taper, micro-sessions)
  lib/      date.js (local-midnight date helpers), derive.js (streak, week stats, gate)
  store/    store.jsx (localStorage-backed context)
  views/    TodayView, CalendarView, WeekSheet, HistoryView
  components/ KazSession (timers + check-in), SessionRow, ui.jsx (rings, sheets, chips)
```

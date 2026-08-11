// Knee Ability Zero — the 10-step routine, in order.
// `prescription` is the display string; `target` drives the little
// "1 x 25" chip on each card.

export const KAZ_EXERCISES = [
  {
    id: 'tib-raise-1',
    name: 'Tibialis Raise',
    target: '1 × 25',
    cue: 'Flex toes up, hold 2 sec top, lower slow.',
    group: 'strength',
  },
  {
    id: 'fhl-calf',
    name: 'FHL Calf Raise',
    target: '1 × 25',
    cue: 'Rise onto big-toe side, no break before next step.',
    group: 'strength',
  },
  {
    id: 'tib-raise-2',
    name: 'Tibialis Raise (repeat)',
    target: '1 × 25',
    cue: 'Immediately after FHL, no rest.',
    group: 'strength',
  },
  {
    id: 'kot-calf',
    name: 'KOT Calf Raise',
    target: '1 × 25',
    cue: 'Knees forward over toes, rise onto toes.',
    group: 'strength',
  },
  {
    id: 'patrick-step',
    name: 'Patrick Step',
    target: '25 / side (1–3 sets)',
    cue: 'Hips forward, step down and tap, control knee travel over toes.',
    group: 'strength',
  },
  {
    id: 'atg-split-squat',
    name: 'ATG Split Squat',
    target: 'Build up reps',
    cue: 'Rear-elevated split squat, deep knee travel, pain-free range only.',
    group: 'strength',
  },
  {
    id: 'elephant-walk',
    name: 'Elephant Walk',
    target: '10 reps / side',
    cue: 'Hamstring/calf mobility, straight legs, walk hands to feet.',
    group: 'mobility',
  },
  {
    id: 'l-sit',
    name: 'L-Sit',
    target: 'Build up hold time',
    cue: 'Core + hip flexor, seated leg raise hold.',
    group: 'core',
  },
  {
    id: 'couch-stretch',
    name: 'Couch Stretch',
    target: '1–2 min / side',
    cue: 'Rear foot elevated behind you, hip flexor stretch.',
    group: 'mobility',
  },
  {
    id: 'piriformis',
    name: 'Piriformis Stretch (figure-4)',
    target: '1–2 min / side',
    cue: 'Lying on back, ankle over opposite knee, pull leg to chest.',
    group: 'mobility',
  },
]

export const PAIN_OPTIONS = [
  {
    id: 'pain-free',
    label: 'Pain-free',
    short: 'Pain-free',
    color: '#a8ff00',
    blurb: 'Green light. Progress as planned next session.',
  },
  {
    id: 'mild',
    label: 'Mild discomfort',
    short: 'Mild',
    color: '#ffd23f',
    blurb: 'Hold this level. Repeat the same load next session before adding.',
  },
  {
    id: 'hurt',
    label: 'Stop, it hurt',
    short: 'Hurt',
    color: '#ff5c5c',
    blurb:
      'Elevate the surface, shorten the range, or assist the movement next time. Do not push through it.',
  },
]

export const PAIN_BY_ID = Object.fromEntries(PAIN_OPTIONS.map((p) => [p.id, p]))

/** Short subsets used in Phase 3 micro-sessions. */
export const KAZ_SUBSETS = {
  express: ['tib-raise-1', 'fhl-calf', 'tib-raise-2', 'kot-calf'],
  mobility: ['elephant-walk', 'couch-stretch', 'piriformis'],
  knees: ['patrick-step', 'atg-split-squat'],
}

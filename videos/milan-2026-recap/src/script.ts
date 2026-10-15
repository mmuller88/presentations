// Copy, timing and story data. `*word*` renders as the italic serif accent.
// Beats are the shared clock: visuals and scripts/build-music.mjs both read this file.

export const FPS = 30
export const WIDTH = 1080
export const HEIGHT = 1350
export const BPM = 120

/** Seconds per scene, in order. Total = video length. */
export const BEATS = {
  hook: 4,
  crew: 4,
  host: 4,
  sponsors: 4,
  keynotes: 5,
  speakers: 6,
  mytalk: 4,
  end: 4,
} as const

export type BeatId = keyof typeof BEATS

/** Scenes that open with a tricolore stripe wipe, and its direction (1 = left to right). */
export const WIPES: Partial<Record<BeatId, 1 | -1>> = {
  crew: -1,
  host: 1,
  sponsors: -1,
  keynotes: 1,
  speakers: -1,
  mytalk: 1,
  end: -1,
}

/**
 * Quarter-note offsets from the start of a scene when a photo, chip, name, card
 * or packet lands. The soundtrack plays a data blip on each one.
 */
export const POPS = {
  hook: [5, 6, 7],
  /** Dinner photo, then the three names. */
  crew: [1, 2, 3.5, 5],
  host: [3, 4, 5, 6],
  sponsors: [1.5, 3, 4.5],
  keynotes: [1, 3.5],
  speakers: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5],
  mytalk: [1, 2, 3, 4],
} as const

export const BLIPS = POPS

export const COPY = {
  hook: {
    kicker: 'ServerlessDays Milano',
    line: 'Still *buzzing.*',
    chips: ['Independent', 'Community-run', 'Packed room'],
  },
  crew: {
    team: 'Orga team',
    dinner: 'Speaker dinner',
    line: 'Grazie, *crew.*',
    names: ['Marco Giuseppini', 'Federico Tensi', 'Dennis Dore'],
    sub: 'Program · speaker dinner · a full day on rails',
  },
  host: {
    caption: 'WAO Romolo C30',
    line: 'Hosted by *OverNet.*',
    volunteer: 'Volunteers: the invisible *glue*',
    chips: ['Registration', 'AV', 'Room flow', 'MC'],
  },
  sponsors: {
    lines: ['Thank you for backing', 'the *community.*'],
    headline: 'Headline',
    gold: 'Gold',
  },
  keynotes: {
    kicker: 'Keynotes',
  },
  speakers: {
    line: 'Speakers set the *bar.*',
  },
  mytalk: {
    kicker: 'My talk',
    lines: ['The AI Factory', 'That *Never* *Sleeps*'],
    thanks: 'Grazie for the questions.',
  },
  end: {
    line: 'Slides are *public.*',
    next: 'See you at the next ServerlessDays',
    host: 'milan.serverlessdays.io',
    slides: 'mmuller88.github.io/presentations/milan-2026-ai-factory',
  },
} as const

export const SLIDES_URL = 'https://mmuller88.github.io/presentations/milan-2026-ai-factory/'

export const KEYNOTES = [
  {
    name: 'Luca Mezzalira',
    org: 'Amazon Web Services',
    title: 'Serverless is not what you think it is',
    photo: 'luca-mezzalira.jpeg',
  },
  {
    name: 'Julian Wood',
    org: 'Amazon Web Services',
    title: 'Serverless compute for all kinds of workloads',
    photo: 'julian-wood.jpeg',
    chip: 'Lambda Web Functions',
  },
] as const

export const SPEAKERS = [
  { names: 'Tommaso Stocchi', topic: 'Aspire inner loop', photos: ['tommaso-stocchi.jpg'] },
  { names: 'Diego Rossi', topic: 'Step Functions @ THRON', photos: ['diego-rossi.jpeg'] },
  { names: 'Davide De Sio', topic: 'Agentic Strangler', photos: ['davide-de-sio.jpeg'] },
  { names: 'Giulia Scalaberni', topic: 'Humanship', photos: ['giulia-scalaberni.jpeg'] },
  { names: 'Daniele Frasca', topic: 'Trust is the architecture', photos: ['daniele-frasca.jpeg'] },
  { names: 'Frangioni & Ricci', topic: 'Slack @ Docebo', photos: ['alessandro-frangioni.jpg', 'andrea-ricci.jpg'] },
  { names: 'Ippolito & Bartilucci', topic: 'Serverless @ Swisscom', photos: ['luca-ippolito.jpeg', 'andrea-bartilucci.jpg'] },
  { names: 'Alberto Ossola', topic: '.NET Native AOT', photos: ['alberto-ossola.jpg'] },
  { names: 'Nicola Racco', topic: 'Omnichannel AI', photos: ['nicola-racco.jpeg'] },
] as const

export type FlowIcon = 'telegram' | 'openclaw' | 'plan' | 'pr'

export const FLOW: readonly { icon: FlowIcon; label: string; sub?: string }[] = [
  { icon: 'telegram', label: 'Telegram' },
  { icon: 'openclaw', label: 'OpenClaw' },
  { icon: 'plan', label: 'GitHub', sub: 'plan' },
  { icon: 'pr', label: 'PR' },
]

/** Beat offset inside mytalk when the packet lands on each node. */
export const FLOW_HOPS = [1, 2, 3, 4] as const

/** International Morse, 20 WPM: one unit is 60 ms. Spells CIAO from the hook. */
export const MORSE_UNIT_S = 0.06
export const MORSE_START_S = 0.4

const MORSE_CODE: Record<string, string> = { C: '-.-.', I: '..', A: '.-', O: '---' }

export type MorseEvent = {
  t: number
  dur: number
  symbol: '.' | '-'
  letter: string
  index: number
}

export const MORSE: MorseEvent[] = (() => {
  const events: MorseEvent[] = []
  let units = 0
  for (const letter of 'CIAO') {
    const code = MORSE_CODE[letter]
    for (let i = 0; i < code.length; i++) {
      const symbol = code[i] as '.' | '-'
      const len = symbol === '-' ? 3 : 1
      events.push({
        t: MORSE_START_S + units * MORSE_UNIT_S,
        dur: len * MORSE_UNIT_S,
        symbol,
        letter,
        index: i,
      })
      units += len
      if (i < code.length - 1) units += 1
    }
    units += 3
  }
  return events
})()

export const MUSIC: string | null = 'music.wav'
export const MUSIC_VOLUME = 0.9

export const sec = (s: number) => Math.round(s * FPS)

/** Frames from the start of a scene to a beat offset. 120 BPM → 15 frames per beat. */
export const atBeat = (beat: number) => Math.round(beat * (60 / BPM) * FPS)

export const SCENES = (Object.keys(BEATS) as BeatId[]).map((id) => ({ id, frames: sec(BEATS[id]) }))

export const TOTAL_FRAMES = SCENES.reduce((sum, scene) => sum + scene.frames, 0)

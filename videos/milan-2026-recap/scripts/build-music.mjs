// Italo-disco bed locked to the beat lengths in src/script.ts.
// Morse "CIAO", octave-sequencer bass, tom fills, data blips, mandolin tremolo.
// The end card quotes Funiculì, Funiculà (Denza, 1880, public domain): Ricordi plate
// 47127, Sibley 1802.8869, vocal in E-flat, transposed down a semitone into D.
// Writes public/music.wav (48 kHz, 16-bit stereo), mastered to TARGET_LUFS. Deterministic.
import { mkdirSync, writeFileSync } from 'node:fs'
import { BEATS, BLIPS, BPM, MORSE, WIPES } from '../src/script.ts'

const SR = 48000
const SPB = 60 / BPM
const TARGET_LUFS = -15
const OUT_DIR = new URL('../public/', import.meta.url)

// ---------------------------------------------------------------- score

/** [chord, quarter-beats] per section. Sum × 0.5s must equal BEATS[id]. */
const ARRANGEMENT = {
  hook: [['Dm', 8]],
  crew: [['Dm', 4], ['Bb', 4]],
  host: [['C', 4], ['A', 4]],
  sponsors: [['Dm', 4], ['Bb', 4]],
  keynotes: [['C', 4], ['A', 4], ['Dm', 2]],
  speakers: [['Dm', 4], ['Bb', 4], ['C', 4]],
  mytalk: [['Dm', 4], ['It6', 2], ['A', 2]],
  end: [['D', 8]],
}

/** Pad voicing and bass root as MIDI notes. It6 is the Italian augmented sixth. */
const CHORDS = {
  Dm: { pad: [62, 65, 69, 74], bass: 50 },
  Bb: { pad: [58, 62, 65, 70], bass: 46 },
  C: { pad: [60, 64, 67, 72], bass: 48 },
  A: { pad: [57, 61, 64, 69], bass: 45 },
  It6: { pad: [58, 62, 68], bass: 46 },
  D: { pad: [62, 66, 69, 74], bass: 50 },
}

/** Drums + bass per section; the last `fill` beats become a tom fill. */
const GROOVE = {
  crew: { fill: 2, shaker: false },
  host: { fill: 2, shaker: false },
  sponsors: { fill: 2, shaker: true },
  keynotes: { fill: 2, shaker: false },
  speakers: { fill: 2, shaker: true },
  mytalk: { fill: 2, shaker: false },
}

/** Original mandolin line, D harmonic minor: [quarter-beat, midi, duration in beats]. */
const MELODY = [
  [32.5, 74, 0.85], [33.5, 77, 0.85], [34.5, 81, 0.85], [35.5, 79, 0.85],
  [36.5, 77, 0.85], [37.5, 76, 0.85], [38.5, 74, 0.85], [39.5, 73, 0.85], [40.5, 74, 1.2],
  [42.5, 77, 0.85], [43.5, 81, 0.85], [44.5, 85, 0.85], [45.5, 81, 0.85],
  [46.5, 79, 0.85], [47.5, 77, 0.85], [48.5, 76, 0.85], [49.5, 74, 0.85],
  [50.5, 73, 0.85], [51.5, 74, 0.85], [52.5, 81, 1.1],
  [54.5, 74, 0.85], [55.5, 77, 0.85], [56.5, 76, 0.85], [57.2, 74, 0.7],
]

const TOMS = [74, 69, 65, 60]

/**
 * Chorus vocal, Eb → D. Two "jammo" dotted quarters (D5 → C#5), then the
 * "Funiculì, funiculà" eighths (G Ab → F# G, Bb → A). Eighth = 1/3 beat.
 */
const FUNICULI_CALL = 73
const FUNICULI = [66, 67, 66, 66, 66, 66, 66, 69, 66, 69, 66, 69]

const ARP = [0, 1, 2, 3, 1, 2, 3, 2]
const ARP_ACCENT = [1, 0.55, 0.8, 0.6]

/** Bus levels in the final mix. */
const MIX = { drums: 1, bass: 1, pad: 1.8, arp: 1.7, lead: 2.6, fx: 1, verb: 1.2, echo: 1 }

// ---------------------------------------------------------------- timeline

const sections = []
let cursor = 0
for (const id of Object.keys(BEATS)) {
  if (!ARRANGEMENT[id]) throw new Error(`No ARRANGEMENT for beat "${id}" in build-music.mjs`)
  const start = cursor
  const chords = ARRANGEMENT[id].map(([name, len]) => {
    const chord = { name, start: cursor, len }
    cursor += len
    return chord
  })
  const seconds = (cursor - start) * SPB
  if (Math.abs(seconds - BEATS[id]) > 1e-9) {
    throw new Error(`"${id}" lasts ${BEATS[id]}s in script.ts but ${seconds}s in ARRANGEMENT; update build-music.mjs`)
  }
  sections.push({ id, start, end: cursor, chords })
}

const SECONDS = cursor * SPB
const LEN = Math.round(SECONDS * SR)
const at = (beat) => beat * SPB
const section = (id) => sections.find((s) => s.id === id)
const cut = (id) => at(section(id).start)
const chordAt = (beat) => {
  for (const s of sections) for (const c of s.chords) if (beat >= c.start && beat < c.start + c.len) return CHORDS[c.name]
  return CHORDS[sections.at(-1).chords.at(-1).name]
}

// ---------------------------------------------------------------- dsp

let seed = 20261014
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const noise = () => rand() * 2 - 1
const midiHz = (m) => 440 * 2 ** ((m - 69) / 12)
const TAU = Math.PI * 2

/** Anti-aliasing correction for naive saw waves. */
const blep = (t, dt) => {
  if (t < dt) {
    t /= dt
    return t + t - t * t - 1
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt
    return t * t + t + t + 1
  }
  return 0
}

/** Zero-delay-feedback state variable filter. */
class SVF {
  ic1 = 0
  ic2 = 0
  f = -1
  q = -1
  run(x, f, q) {
    if (f !== this.f || q !== this.q) {
      const g = Math.tan((Math.PI * Math.min(f, SR * 0.45)) / SR)
      this.k = 1 / q
      this.a1 = 1 / (1 + g * (g + this.k))
      this.a2 = g * this.a1
      this.a3 = g * this.a2
      this.f = f
      this.q = q
    }
    const v3 = x - this.ic2
    const v1 = this.a1 * this.ic1 + this.a2 * v3
    const v2 = this.ic2 + this.a2 * this.ic1 + this.a3 * v3
    this.ic1 = 2 * v1 - this.ic1
    this.ic2 = 2 * v2 - this.ic2
    this.v1 = v1
    this.v2 = v2
  }
  lp(x, f, q = 0.707) {
    this.run(x, f, q)
    return this.v2
  }
  hp(x, f, q = 0.707) {
    this.run(x, f, q)
    return x - this.k * this.v1 - this.v2
  }
  bp(x, f, q = 0.707) {
    this.run(x, f, q)
    return this.k * this.v1
  }
}

const pair = () => [new Float32Array(LEN), new Float32Array(LEN)]
const BUS = { drums: pair(), bass: pair(), pad: pair(), arp: pair(), lead: pair(), fx: pair(), verb: pair(), echo: pair() }

/** One stereo sample, written by the voice callbacks below. */
const LR = new Float64Array(2)

/** Runs `voice(t)` for `dur` seconds from `t0` and mixes LR into the given [bus, gain] sends. */
function play(t0, dur, voice, sends) {
  const i0 = Math.round(t0 * SR)
  const n = Math.round(dur * SR)
  const ls = sends.map(([b]) => b[0])
  const rs = sends.map(([b]) => b[1])
  const gs = sends.map(([, g]) => g)
  for (let k = 0; k < n; k++) {
    const i = i0 + k
    if (i >= LEN) break
    voice(k / SR)
    if (i < 0) continue
    for (let s = 0; s < gs.length; s++) {
      ls[s][i] += LR[0] * gs[s]
      rs[s][i] += LR[1] * gs[s]
    }
  }
}

const panGains = (pan) => [Math.cos(((pan + 1) * Math.PI) / 4), Math.sin(((pan + 1) * Math.PI) / 4)]

// ---------------------------------------------------------------- instruments

const kickTimes = []

function kick(t0, vel = 1) {
  kickTimes.push(t0)
  let ph = 0
  play(t0, 0.42, (t) => {
    ph += (46 + 120 * Math.exp(-t / 0.03) + 280 * Math.exp(-t / 0.0025)) / SR
    const env = Math.min(1, t / 0.0008) * Math.exp(-t / 0.19) * Math.min(1, (0.42 - t) / 0.05)
    const x = (Math.tanh(1.8 * Math.sin(TAU * ph) * env) / Math.tanh(1.8)) * vel
    LR[0] = x
    LR[1] = x
  }, [[BUS.drums, 0.8]])
}

function clap(t0, vel = 1) {
  const fl = new SVF()
  const fr = new SVF()
  play(t0, 0.4, (t) => {
    let env = 0
    for (let k = 0; k < 3; k++) {
      const u = t - k * 0.0105
      if (u >= 0) env += Math.exp(-u / 0.0045)
    }
    const u = t - 0.021
    if (u >= 0) env += 0.85 * Math.exp(-u / 0.095)
    LR[0] = fl.bp(noise(), 1300, 1.2) * env * vel
    LR[1] = fr.bp(noise(), 1150, 1.2) * env * vel
  }, [[BUS.drums, 0.55], [BUS.verb, 0.2]])
}

const METAL = [205.3, 304.4, 369.6, 522.7, 540, 800]

function hat(t0, vel, open = false) {
  const h1 = new SVF()
  const h2 = new SVF()
  const decay = open ? 0.12 : 0.028
  play(t0, open ? 0.45 : 0.12, (t) => {
    let metal = 0
    for (const f of METAL) metal += Math.sin(TAU * f * 1.7 * t) > 0 ? 1 : -1
    const x = h2.hp(h1.hp(0.55 * noise() + 0.08 * metal, 7200, 0.8), 7200, 0.8)
    const env = Math.min(1, t / 0.0006) * Math.exp(-t / decay) * vel
    LR[0] = x * env * 0.85
    LR[1] = x * env
  }, [[BUS.drums, open ? 0.3 : 0.24]])
}

function shaker(t0, vel) {
  const f = new SVF()
  play(t0, 0.12, (t) => {
    const x = f.bp(noise(), 6000, 1.3) * Math.min(1, t / 0.007) * Math.exp(-t / 0.03) * vel
    LR[0] = x
    LR[1] = x * 0.55
  }, [[BUS.drums, 0.2]])
}

function snare(t0, vel) {
  const f = new SVF()
  let ph = 0
  play(t0, 0.3, (t) => {
    ph += (185 + 70 * Math.exp(-t / 0.008)) / SR
    const tone = 0.45 * Math.sin(TAU * ph) * Math.exp(-t / 0.045)
    const rattle = 0.75 * f.hp(noise(), 1700) * Math.exp(-t / 0.085)
    const x = (tone + rattle) * Math.min(1, t / 0.0006) * vel
    LR[0] = x
    LR[1] = x
  }, [[BUS.drums, 0.4], [BUS.verb, 0.18]])
}

function crash(t0, vel = 1, decay = 1.1) {
  const fl = new SVF()
  const fr = new SVF()
  play(t0, decay * 3.5, (t) => {
    const env = Math.min(1, t / 0.0015) * Math.exp(-t / decay) * vel
    LR[0] = fl.hp(noise(), 3800, 0.6) * env
    LR[1] = fr.hp(noise(), 4100, 0.6) * env
  }, [[BUS.fx, 0.2], [BUS.verb, 0.1]])
}

/** Cymbal swelling into `T`, stopping dead on the cut. */
function reverseCymbal(T, len, vel = 1) {
  const fl = new SVF()
  const fr = new SVF()
  play(T - len, len, (t) => {
    const u = len - t
    const env = Math.exp(-u / 0.3) * Math.min(1, u / 0.004) * vel
    const f = 2500 + 5000 * (t / len)
    LR[0] = fl.hp(noise(), f, 0.6) * env
    LR[1] = fr.hp(noise(), f, 0.6) * env
  }, [[BUS.fx, 0.25]])
}

/** Air whoosh peaking on `T`, panning across the stereo field in the wipe's direction. */
function whoosh(T, dir, vel = 1) {
  const pre = 0.4
  const fl = new SVF()
  const fr = new SVF()
  play(T - pre, 0.85, (t) => {
    const u = t - pre
    const env = (u < 0 ? (1 + u / pre) ** 2.5 : Math.exp(-u / 0.12)) * vel
    const f = 700 + 5000 * Math.max(0, 1 - Math.abs(u) / pre) ** 2
    const [gl, gr] = panGains(Math.max(-1, Math.min(1, (u / pre) * dir)))
    LR[0] = fl.bp(noise(), f, 1.6) * env * gl
    LR[1] = fr.bp(noise(), f * 1.04, 1.6) * env * gr
  }, [[BUS.fx, 0.45], [BUS.verb, 0.12]])
}

/** Noise sweep plus rising tone, ending on `T`. */
function riser(T, len, vel = 1) {
  const fl = new SVF()
  const fr = new SVF()
  let ph = 0
  play(T - len, len, (t) => {
    const p = t / len
    const env = p * p * Math.min(1, (len - t) / 0.01) * vel
    const f = 300 * 25 ** p
    ph += (220 * 4 ** p) / SR
    const tone = 0.25 * Math.sin(TAU * ph)
    LR[0] = (fl.bp(noise(), f, 2) + tone) * env
    LR[1] = (fr.bp(noise(), f * 1.06, 2) + tone) * env
  }, [[BUS.fx, 0.25], [BUS.verb, 0.12]])
}

/** Sub drop that sells each big cut. */
function boom(T, vel = 1) {
  kickTimes.push(T)
  let ph = 0
  play(T, 2, (t) => {
    ph += (32 + 40 * Math.exp(-t / 0.25)) / SR
    const x = Math.tanh(1.5 * Math.sin(TAU * ph)) * Math.min(1, t / 0.003) * Math.exp(-t / 0.7) * vel
    LR[0] = x
    LR[1] = x
  }, [[BUS.fx, 0.5]])
}

/** Sonar ping for the map pulse. */
function ping(t0, midi, vel = 1) {
  const f = midiHz(midi)
  let ph = 0
  play(t0, 1.6, (t) => {
    ph += f / SR
    const x = (Math.sin(TAU * ph) + 0.25 * Math.sin(2 * TAU * ph)) * Math.min(1, t / 0.004) * Math.exp(-t / 0.35) * vel
    LR[0] = x
    LR[1] = x
  }, [[BUS.lead, 0.16], [BUS.echo, 0.35], [BUS.verb, 0.3]])
}

function bass(t0, midi, dur, vel = 1) {
  const f = midiHz(midi)
  const dt = f / SR
  const lp = new SVF()
  let ph = 0
  let sub = 0
  play(t0, dur + 0.03, (t) => {
    ph += dt
    if (ph >= 1) ph -= 1
    sub += dt / 2
    if (sub >= 1) sub -= 1
    const saw = 2 * ph - 1 - blep(ph, dt)
    const mid = lp.lp(saw, 220 + 1400 * Math.exp(-t / 0.07), 0.9)
    const env = Math.min(1, t / 0.004) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.03) : 1) * vel
    const x = (0.75 * Math.sin(TAU * sub) + 0.55 * mid) * env
    LR[0] = x
    LR[1] = x
  }, [[BUS.bass, 0.5]])
}

const DETUNE = [-0.16, -0.07, 0, 0.07, 0.16]

/** Supersaw chord; filtering and sidechain happen on the pad bus. */
function padChord(t0, notes, dur, vel = 1) {
  const voices = []
  for (const m of notes) {
    DETUNE.forEach((d, v) => {
      const [gl, gr] = panGains(((v / (DETUNE.length - 1)) * 2 - 1) * 0.8)
      voices.push({ dt: midiHz(m + d) / SR, ph: rand(), gl, gr })
    })
  }
  play(t0, dur + 0.4, (t) => {
    const env = Math.min(1, t / 0.05) * (t > dur ? Math.exp(-(t - dur) / 0.1) : 1) * vel
    let l = 0
    let r = 0
    for (const vo of voices) {
      vo.ph += vo.dt
      if (vo.ph >= 1) vo.ph -= 1
      const s = 2 * vo.ph - 1 - blep(vo.ph, vo.dt)
      l += s * vo.gl
      r += s * vo.gr
    }
    LR[0] = l * env
    LR[1] = r * env
  }, [[BUS.pad, 0.035]])
}

function pluck(t0, midi, vel = 1, bright = 1) {
  const d1 = midiHz(midi - 0.07) / SR
  const d2 = midiHz(midi + 0.07) / SR
  const fl = new SVF()
  const fr = new SVF()
  let p1 = rand()
  let p2 = rand()
  play(t0, 0.45, (t) => {
    p1 += d1
    if (p1 >= 1) p1 -= 1
    p2 += d2
    if (p2 >= 1) p2 -= 1
    const s1 = 2 * p1 - 1 - blep(p1, d1)
    const s2 = 2 * p2 - 1 - blep(p2, d2)
    const f = 500 + 5200 * bright * Math.exp(-t / 0.06)
    const env = Math.min(1, t / 0.002) * Math.exp(-t / 0.14) * vel
    LR[0] = fl.lp(s1 * 0.8 + s2 * 0.3, f, 1.3) * env
    LR[1] = fr.lp(s2 * 0.8 + s1 * 0.3, f, 1.3) * env
  }, [[BUS.arp, 0.16], [BUS.echo, 0.16], [BUS.verb, 0.08]])
}

/** FM bell for the hook melody. */
function bell(t0, midi, dur, vel = 1) {
  const f = midiHz(midi)
  let pc = 0
  let pm = 0
  play(t0, dur + 1.2, (t) => {
    pc += f / SR
    pm += (2 * f) / SR
    const index = 0.4 + 2.2 * Math.exp(-t / 0.25)
    const car = Math.sin(TAU * pc + index * Math.sin(TAU * pm))
    const shimmer = 0.15 * Math.sin(TAU * pc * 2.001) * Math.exp(-t / 0.4)
    const env = Math.min(1, t / 0.005) * (0.35 + 0.65 * Math.exp(-t / 0.35)) * (t > dur ? Math.exp(-(t - dur) / 0.35) : 1) * vel
    LR[0] = (car + shimmer) * env
    LR[1] = (car + shimmer) * env
  }, [[BUS.lead, 0.14], [BUS.echo, 0.12], [BUS.verb, 0.22]])
}

/** Telegraph tone for the Morse intro. */
function morseBeep(t0, dur) {
  const f = 880
  let ph = 0
  play(t0, dur, (t) => {
    ph += f / SR
    const env = Math.min(1, t / 0.003) * Math.min(1, Math.max(0, dur - t) / 0.005)
    const x = Math.sin(TAU * ph) * env
    LR[0] = x
    LR[1] = x
  }, [[BUS.lead, 0.28], [BUS.verb, 0.05]])
}

/** Short square blip when a card, chip or packet lands. */
function blip(t0, midi, vel = 1) {
  const f = midiHz(midi)
  const dt = f / SR
  const lp = new SVF()
  let ph = 0
  play(t0, 0.07, (t) => {
    ph += dt
    if (ph >= 1) ph -= 1
    const sq = ph < 0.5 ? 1 : -1
    const env = Math.min(1, t / 0.0015) * Math.exp(-t / 0.018) * vel
    const x = lp.lp(sq, 1800 + 4000 * Math.exp(-t / 0.02), 0.8) * env
    LR[0] = x * 0.85
    LR[1] = x
  }, [[BUS.fx, 0.18]])
}

/** Simmons-style tom: a fast pitch drop into a sine. */
function tom(t0, midi, vel = 1) {
  const f0 = midiHz(midi)
  let ph = 0
  play(t0, 0.32, (t) => {
    ph += (f0 * (1 + 1.6 * Math.exp(-t / 0.015))) / SR
    const env = Math.min(1, t / 0.001) * Math.exp(-t / 0.08) * vel
    const x = Math.tanh(1.7 * Math.sin(TAU * ph)) * env
    LR[0] = x
    LR[1] = x
  }, [[BUS.drums, 0.42], [BUS.verb, 0.06]])
}

/** Mandolin tremolo: a string tone broken into fast plucks. */
function mandolin(t0, midi, dur, vel = 1) {
  const f = midiHz(midi)
  let ph = 0
  const rate = 16
  play(t0, dur + 0.04, (t) => {
    ph += f / SR
    const cycle = (t * rate) % 1
    const body = Math.sin(TAU * ph) + 0.35 * Math.sin(2 * TAU * ph) + 0.12 * Math.sin(3 * TAU * ph)
    const env = Math.min(1, t / 0.008) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.04) : 1)
    const x = body * Math.exp(-cycle / 0.28) * env * vel * 0.32
    LR[0] = x
    LR[1] = x * 0.9
  }, [[BUS.lead, 0.2], [BUS.verb, 0.1]])
}

// ---------------------------------------------------------------- arrangement

for (const s of sections) {
  for (const c of s.chords) padChord(at(c.start), CHORDS[c.name].pad, at(c.len), s.id === 'hook' ? 0.4 : s.id === 'end' ? 0.75 : 1)

  const g = GROOVE[s.id]
  if (!g) continue
  for (let b = s.start; b < s.end - g.fill; b++) {
    const bar = (b - s.start) % 4
    kick(at(b))
    if (bar === 1 || bar === 3) clap(at(b))
    hat(at(b + 0.5), 0.85, true)
    hat(at(b + 0.25), 0.35 + 0.1 * rand())
    hat(at(b + 0.75), 0.4 + 0.1 * rand())
    if (g.shaker) [0.55, 0.85, 0.6, 1].forEach((v, k) => shaker(at(b + k / 4), v))
    const root = chordAt(b).bass
    bass(at(b), root, 0.1, 1)
    bass(at(b + 0.25), root, 0.06, 0.32)
    bass(at(b + 0.5), root + 12, 0.09, 0.82)
    bass(at(b + 0.75), root + 12, 0.06, 0.4)
  }
  bass(at(s.end - g.fill), chordAt(s.end - g.fill + 0.01).bass, at(g.fill) * 0.9, 0.7)
  TOMS.forEach((midi, k) => tom(at(s.end - g.fill + k * 0.5), midi, 0.72 + k * 0.08))
}

function arp(fromBeat, toBeat, { level = 1, step = 1, vel = () => 1, bright = () => 1 } = {}) {
  for (let q = Math.round(fromBeat * 4); q < Math.round(toBeat * 4); q += step) {
    const b = q / 4
    const notes = chordAt(b).pad
    const p = (b - fromBeat) / (toBeat - fromBeat)
    pluck(at(b), notes[ARP[q % 8] % notes.length] + 12, level * ARP_ACCENT[q % 4] * vel(p), bright(p))
  }
}

for (const event of MORSE) morseBeep(event.t, event.dur * 0.92)

for (const [id, beats] of Object.entries(BLIPS)) {
  const start = section(id).start
  beats.forEach((b, i) => blip(at(start + b), 84 + (i % 5) * 3, 0.7))
}

MELODY.forEach(([beat, midi, dur]) => mandolin(at(beat), midi, at(dur), 0.85))

arp(section('crew').start + 1, section('mytalk').start + 4, { level: 0.7 })

riser(cut('crew'), 1.8, 1.7)
for (const [id, dir] of Object.entries(WIPES)) {
  whoosh(cut(id), dir, 0.9)
  reverseCymbal(cut(id), 0.75, 0.5)
  boom(cut(id), id === 'crew' || id === 'end' ? 1 : 0.5)
}
crash(cut('crew'), 0.85)
riser(cut('end'), 1.5, 0.85)
kick(cut('end'))
crash(cut('end'), 1, 1.6)
bass(cut('end'), CHORDS.D.bass, 1.8, 1)

const end = section('end')
// Two "jammo" calls, then the title turn, done before the final fade.
mandolin(at(end.start + 0.15), FUNICULI_CALL, at(0.7), 2.4)
mandolin(at(end.start + 1.05), FUNICULI_CALL, at(0.7), 2.6)
FUNICULI.forEach((midi, i) => mandolin(at(end.start + 2.1 + i / 3), midi, at(0.32), i % 4 === 3 ? 3.4 : 2.8))

// ---------------------------------------------------------------- processing

const duck = new Float32Array(LEN)
for (const t of kickTimes) {
  const i0 = Math.round(t * SR)
  for (let k = 0; k < 0.45 * SR && i0 + k < LEN; k++) {
    const u = k / SR
    const d = u < 0.004 ? u / 0.004 : Math.exp(-(u - 0.004) / 0.085)
    if (d > duck[i0 + k]) duck[i0 + k] = d
  }
}

const padCutoff = (t) => {
  const drop = cut('crew')
  const keys = cut('keynotes')
  const e = cut('end')
  if (t < drop) return 240 * (2200 / 240) ** (t / drop)
  if (t < keys) return 2400 + 800 * ((t - drop) / (keys - drop))
  if (t < e) return 3400 + 1200 * ((t - keys) / (e - keys))
  return 2800 * (900 / 2800) ** Math.min(1, (t - e) / 3)
}

for (const ch of BUS.pad) {
  const hp = new SVF()
  const lp = new SVF()
  for (let i = 0; i < LEN; i++) ch[i] = lp.lp(hp.hp(ch[i], 180), padCutoff(i / SR), 0.75) * (1 - 0.7 * duck[i])
}
for (let c = 0; c < 2; c++) for (let i = 0; i < LEN; i++) BUS.verb[c][i] += BUS.pad[c][i] * 0.25

for (const ch of BUS.bass) for (let i = 0; i < LEN; i++) ch[i] *= 1 - 0.55 * duck[i]
for (const ch of BUS.arp) for (let i = 0; i < LEN; i++) ch[i] *= 1 - 0.3 * duck[i]

/** Dotted-eighth ping-pong echo. */
function pingPong([inL, inR], time, feedback, tone) {
  const D = Math.round(time * SR)
  const bl = new Float32Array(D)
  const br = new Float32Array(D)
  const out = pair()
  const lpl = new SVF()
  const lpr = new SVF()
  for (let i = 0, j = 0; i < LEN; i++, j = (j + 1) % D) {
    const dl = bl[j]
    const dr = br[j]
    out[0][i] = dl
    out[1][i] = dr
    bl[j] = (inL[i] + inR[i]) * 0.5 + lpr.lp(dr, tone) * feedback
    br[j] = lpl.lp(dl, tone) * feedback
  }
  return out
}

/** Freeverb (Jezar) with pre-delay; return is band-limited to keep the low end clean. */
function freeverb([inL, inR], { room = 0.86, damp = 0.3, preDelay = 0.02 } = {}) {
  const scale = SR / 44100
  const make = (n) => ({ buf: new Float32Array(Math.round(n * scale)), i: 0, store: 0 })
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617]
  const allpasses = [556, 441, 341, 225]
  const cl = combs.map(make)
  const cr = combs.map((n) => make(n + 23))
  const al = allpasses.map(make)
  const ar = allpasses.map((n) => make(n + 23))
  const comb = (c, x) => {
    const y = c.buf[c.i]
    c.store = y * (1 - damp) + c.store * damp
    c.buf[c.i] = x + c.store * room
    if (++c.i >= c.buf.length) c.i = 0
    return y
  }
  const allpass = (a, x) => {
    const b = a.buf[a.i]
    a.buf[a.i] = x + b * 0.5
    if (++a.i >= a.buf.length) a.i = 0
    return b - x
  }
  const pd = Math.round(preDelay * SR)
  const out = pair()
  const filters = [new SVF(), new SVF(), new SVF(), new SVF()]
  for (let n = 0; n < LEN; n++) {
    const x = n >= pd ? (inL[n - pd] + inR[n - pd]) * 0.015 : 0
    let l = 0
    let r = 0
    for (let c = 0; c < combs.length; c++) {
      l += comb(cl[c], x)
      r += comb(cr[c], x)
    }
    for (let a = 0; a < allpasses.length; a++) {
      l = allpass(al[a], l)
      r = allpass(ar[a], r)
    }
    out[0][n] = filters[0].lp(filters[1].hp(l, 250), 7000)
    out[1][n] = filters[2].lp(filters[3].hp(r, 250), 7000)
  }
  return out
}

const echo = pingPong(BUS.echo, 0.75 * SPB, 0.38, 4500)
for (let c = 0; c < 2; c++) for (let i = 0; i < LEN; i++) BUS.verb[c][i] += echo[c][i] * 0.3
const verb = freeverb(BUS.verb)

const STEMS = { drums: BUS.drums, bass: BUS.bass, pad: BUS.pad, arp: BUS.arp, lead: BUS.lead, fx: BUS.fx, verb, echo }

// ---------------------------------------------------------------- master

const mix = pair()
for (const [name, [l, r]] of Object.entries(STEMS)) {
  for (let i = 0; i < LEN; i++) {
    mix[0][i] += l[i] * MIX[name]
    mix[1][i] += r[i] * MIX[name]
  }
}

const FADE = 0.4
for (const ch of mix) {
  const hp = new SVF()
  for (let i = 0; i < LEN; i++) {
    const p = Math.min(1, Math.max(0, (i / SR - (SECONDS - FADE)) / (FADE - 0.05)))
    ch[i] = hp.hp(ch[i], 28) * 0.5 * (1 + Math.cos(Math.PI * p))
  }
}

/** Integrated loudness (ITU-R BS.1770, K-weighted, gated). */
function lufs(channels) {
  const weighted = channels.map((x) => {
    const y = new Float64Array(x.length)
    const stages = [
      [[1.53512485958697, -2.69169618940638, 1.19839281085285], [-1.69065929318241, 0.73248077421585]],
      [[1, -2, 1], [-1.99004745483398, 0.99007225036621]],
    ]
    let src = x
    for (const [[b0, b1, b2], [a1, a2]] of stages) {
      let x1 = 0
      let x2 = 0
      let y1 = 0
      let y2 = 0
      for (let i = 0; i < src.length; i++) {
        const v = b0 * src[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        x2 = x1
        x1 = src[i]
        y2 = y1
        y1 = v
        y[i] = v
      }
      src = y
    }
    return y
  })
  const block = Math.round(0.4 * SR)
  const hop = Math.round(0.1 * SR)
  const power = []
  for (let s = 0; s + block <= LEN; s += hop) {
    let sum = 0
    for (const w of weighted) for (let i = s; i < s + block; i++) sum += w[i] * w[i]
    power.push(sum / block)
  }
  const loudness = (z) => -0.691 + 10 * Math.log10(z)
  const mean = (zs) => zs.reduce((a, b) => a + b, 0) / zs.length
  const absolute = power.filter((z) => loudness(z) > -70)
  const relative = loudness(mean(absolute)) - 10
  return loudness(mean(absolute.filter((z) => loudness(z) > relative)))
}

const CEILING = 0.88
const knee = (x) => {
  const a = Math.abs(x)
  return a <= 0.6 ? x : Math.sign(x) * (0.6 + 0.4 * Math.tanh((a - 0.6) / 0.4))
}
const master = (gain) => mix.map((ch) => ch.map((x) => knee(x * gain) * CEILING))

let gain = 1
for (let k = 0; k < 5; k++) gain *= 10 ** ((TARGET_LUFS - lufs(master(gain))) / 20)
const out = master(gain)

// ---------------------------------------------------------------- report + write

const dB = (x) => (x > 0 ? (20 * Math.log10(x)).toFixed(1) : '-inf').padStart(6)
for (const [name, ch] of Object.entries(STEMS)) {
  let peak = 0
  let sum = 0
  for (const c of ch) for (let i = 0; i < LEN; i++) {
    peak = Math.max(peak, Math.abs(c[i]))
    sum += c[i] * c[i]
  }
  console.log(`${name.padEnd(6)} peak ${dB(peak * MIX[name] * gain)} dBFS  rms ${dB(Math.sqrt(sum / (2 * LEN)) * MIX[name] * gain)} dBFS`)
}
let peak = 0
for (const c of out) for (let i = 0; i < LEN; i++) peak = Math.max(peak, Math.abs(c[i]))
console.log(`master ${lufs(out).toFixed(1)} LUFS, peak ${dB(peak)} dBFS, gain ${dB(gain)} dB, ${SECONDS}s`)

const wav = Buffer.alloc(44 + LEN * 4)
wav.write('RIFF', 0)
wav.writeUInt32LE(36 + LEN * 4, 4)
wav.write('WAVEfmt ', 8)
wav.writeUInt32LE(16, 16)
wav.writeUInt16LE(1, 20)
wav.writeUInt16LE(2, 22)
wav.writeUInt32LE(SR, 24)
wav.writeUInt32LE(SR * 4, 28)
wav.writeUInt16LE(4, 32)
wav.writeUInt16LE(16, 34)
wav.write('data', 36)
wav.writeUInt32LE(LEN * 4, 40)
for (let i = 0; i < LEN; i++) {
  for (let c = 0; c < 2; c++) {
    const dither = rand() - rand()
    const v = Math.round(out[c][i] * 32767 + dither)
    wav.writeInt16LE(Math.max(-32768, Math.min(32767, v)), 44 + i * 4 + c * 2)
  }
}
mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(new URL('music.wav', OUT_DIR), wav)
console.log('wrote public/music.wav')

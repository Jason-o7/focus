/**
 * The three celebration sounds. They are synthesized on the spot with Web Audio,
 * so the app ships no audio files. Picked by Jason in the sound lab of 2026-09-20.
 */

const MASTER_GAIN = 0.85
const VERB_GAIN = 0.5
const VERB_SECONDS = 2.6
const VERB_FALLOFF = 3.2

const SILENT = 0.0001

/** A cue booked for a later moment, which can still be called off. */
export interface CueHandle {
  cancel: () => void
}

// #region The rig
interface Core {
  ctx: AudioContext
  master: GainNode
  verb: ConvolverNode
}

/** Where one cue writes itself: its two outputs and the moment it begins. */
interface Rig {
  ctx: AudioContext
  master: AudioNode
  verb: AudioNode
  at: number
}

let core: Core | null = null
let broken = false

function impulse(ctx: AudioContext, seconds: number, falloff: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, falloff)
    }
  }

  return buffer
}

function start(): Core | null {
  if (broken) return null

  try {
    if (core === null) {
      const ctx = new AudioContext()

      const master = ctx.createGain()
      master.gain.value = MASTER_GAIN
      master.connect(ctx.destination)

      const verb = ctx.createConvolver()
      verb.buffer = impulse(ctx, VERB_SECONDS, VERB_FALLOFF)

      const wet = ctx.createGain()
      wet.gain.value = VERB_GAIN
      verb.connect(wet)
      wet.connect(master)

      core = { ctx, master, verb }
    }

    core.ctx.resume().catch(() => {})
    return core
  } catch {
    broken = true
    return null
  }
}

// Browsers refuse to open an audio context until the page has been touched once
function unlock() {
  document.removeEventListener('pointerdown', unlock)
  document.removeEventListener('keydown', unlock)
  start()
}

document.addEventListener('pointerdown', unlock)
document.addEventListener('keydown', unlock)

/** A rig that sounds now. */
function wake(): Rig | null {
  const audio = start()
  if (audio === null) return null

  return { ctx: audio.ctx, master: audio.master, verb: audio.verb, at: audio.ctx.currentTime }
}

/** A rig that sounds later, on its own pair of lines so both can be cut. */
function book(inSeconds: number): { rig: Rig; handle: CueHandle } | null {
  const audio = start()
  if (audio === null) return null

  // A suspended context has a frozen clock, so a booking made now would land anywhere
  if (audio.ctx.state !== 'running') return null

  const master = audio.ctx.createGain()
  master.connect(audio.master)

  const verb = audio.ctx.createGain()
  verb.connect(audio.verb)

  return {
    rig: {
      ctx: audio.ctx,
      master,
      verb,
      at: audio.ctx.currentTime + Math.max(0, inSeconds),
    },
    handle: {
      cancel: () => {
        master.disconnect()
        verb.disconnect()
      },
    },
  }
}
// #endregion

// #region Voices
interface ToneOptions {
  freq: number
  to?: number
  glide?: number
  at?: number
  dur?: number
  peak?: number
  attack?: number
  type?: OscillatorType
  send?: number
}

function tone(rig: Rig, options: ToneOptions) {
  const at = rig.at + (options.at ?? 0)
  const dur = options.dur ?? 0.4
  const peak = options.peak ?? 0.25

  const osc = rig.ctx.createOscillator()
  osc.type = options.type ?? 'sine'
  osc.frequency.setValueAtTime(options.freq, at)
  if (options.to !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(options.to, at + (options.glide ?? dur))
  }

  const gain = rig.ctx.createGain()
  gain.gain.setValueAtTime(SILENT, at)
  gain.gain.linearRampToValueAtTime(peak, at + (options.attack ?? 0.004))
  gain.gain.exponentialRampToValueAtTime(SILENT, at + dur)

  osc.connect(gain)
  gain.connect(rig.master)

  if (options.send !== undefined) {
    const send = rig.ctx.createGain()
    send.gain.value = options.send
    gain.connect(send)
    send.connect(rig.verb)
  }

  osc.start(at)
  osc.stop(at + dur + 0.06)
}

interface HitOptions {
  at?: number
  dur?: number
  peak?: number
  freq?: number
  filter?: BiquadFilterType
  q?: number
}

function hit(rig: Rig, options: HitOptions) {
  const at = rig.at + (options.at ?? 0)
  const dur = options.dur ?? 0.1

  const length = Math.ceil(rig.ctx.sampleRate * dur)
  const buffer = rig.ctx.createBuffer(1, length, rig.ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1

  const source = rig.ctx.createBufferSource()
  source.buffer = buffer

  const filter = rig.ctx.createBiquadFilter()
  filter.type = options.filter ?? 'lowpass'
  filter.frequency.setValueAtTime(options.freq ?? 1600, at)
  filter.Q.value = options.q ?? 0.8

  const gain = rig.ctx.createGain()
  gain.gain.setValueAtTime(options.peak ?? 0.3, at)
  gain.gain.exponentialRampToValueAtTime(SILENT, at + dur)

  source.connect(filter)
  filter.connect(gain)
  gain.connect(rig.master)

  source.start(at)
  source.stop(at + dur + 0.02)
}

interface MalletOptions {
  freq: number
  at?: number
  dur?: number
  peak?: number
  send?: number
}

/** A marimba bar: a sine with its fourth harmonic on top, both gone quickly. */
function mallet(rig: Rig, options: MalletOptions) {
  const dur = options.dur ?? 0.55
  const peak = options.peak ?? 0.3

  tone(rig, { freq: options.freq, at: options.at, dur, peak, send: options.send ?? 0.3 })
  tone(rig, { freq: options.freq * 4, at: options.at, dur: dur * 0.3, peak: peak * 0.22 })
  hit(rig, { at: options.at, dur: 0.02, peak: 0.07, freq: 3200, filter: 'highpass' })
}

interface TapOptions {
  freq: number
  at?: number
  peak?: number
  ring?: number
}

/**
 * A wooden tap. The knock is a narrow resonant burst rather than a dull thud,
 * which is the part that survives a noisy room.
 */
function woodTap(rig: Rig, options: TapOptions) {
  const at = options.at ?? 0
  const peak = options.peak ?? 0.42
  const ring = options.ring ?? 0.13

  hit(rig, { at, dur: 0.05, peak: peak * 0.9, freq: options.freq * 2.4, filter: 'bandpass', q: 9 })
  hit(rig, { at, dur: 0.02, peak: peak * 0.3, freq: options.freq * 4.6, filter: 'bandpass', q: 6 })

  tone(rig, {
    freq: options.freq,
    to: options.freq * 0.88,
    at,
    dur: ring,
    peak,
    type: 'triangle',
    glide: ring * 0.7,
  })
  tone(rig, { freq: options.freq * 3.1, at, dur: 0.045, peak: peak * 0.22 })
  tone(rig, { freq: options.freq * 2, at, dur: ring * 0.6, peak: peak * 0.14, send: 0.35 })
}

function semitone(root: number, steps: number): number {
  return root * Math.pow(2, steps / 12)
}
// #endregion

// #region The cues
/** A water drop. Short and rising, so it marks the day without ever becoming a tune. */
export function playGoalReached() {
  const audio = wake()
  if (audio === null) return

  tone(audio, { freq: 430, to: 1250, dur: 0.1, peak: 0.42 })
  hit(audio, { dur: 0.03, peak: 0.12, freq: 2800, filter: 'highpass' })
}

/**
 * A marimba staircase. `share` is how far past the goal the day went, from 0 to 1,
 * and it only moves the last step: a long day ends higher than a short one.
 */
export function playGoalPassed(share = 0) {
  const audio = wake()
  if (audio === null) return

  const root = 523.25
  const reach = Math.min(1, Math.max(0, share))
  const steps = [0, 2, 4, 7, 12 + Math.round(reach * 7)]

  steps.forEach((step, index) => {
    mallet(audio, {
      freq: semitone(root, step),
      at: index * 0.095,
      dur: index === steps.length - 1 ? 1.1 : 0.45,
      peak: 0.26,
      send: 0.45,
    })
  })
}

/** Five wooden taps climbing. The rhythm is what carries it over background sound. */
function overtime(rig: Rig) {
  const root = 440
  const steps = [0, 2, 4, 7, 9]

  steps.forEach((step, index) => {
    woodTap(rig, {
      freq: semitone(root, step),
      at: index * 0.095,
      peak: 0.34 + index * 0.03,
      ring: index === steps.length - 1 ? 0.28 : 0.11,
    })
  })
}

export function playOvertime() {
  const audio = wake()
  if (audio === null) return

  overtime(audio)
}

/**
 * Books the overtime cue for a moment in the future. The audio clock keeps its own
 * time, so this sounds on the dot even while the tab is hidden and its timers are throttled.
 */
export function scheduleOvertime(inSeconds: number): CueHandle | null {
  const booked = book(inSeconds)
  if (booked === null) return null

  overtime(booked.rig)
  return booked.handle
}
// #endregion

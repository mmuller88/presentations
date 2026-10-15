import { Img, useCurrentFrame, useVideoConfig } from 'remotion'
import { ASSETS } from '../assets'
import { EASE_IN_OUT, pop, progress } from '../lib/anim'
import { atBeat, type FlowIcon } from '../script'

const NODE_W = 230

type Node = { icon: FlowIcon; label: string; sub?: string }

const Glyph: React.FC<{ icon: FlowIcon }> = ({ icon }) => {
  if (icon === 'openclaw') {
    return (
      <div className="grid h-[84px] w-[84px] place-items-center rounded-[20px] bg-white/10 ring-1 ring-white/15">
        <Img src={ASSETS.openclaw} className="h-[64px] w-[64px]" />
      </div>
    )
  }
  if (icon === 'telegram') {
    return (
      <svg viewBox="0 0 80 80" className="h-[84px] w-[84px]">
        <rect width="80" height="80" rx="20" fill="#229ED9" />
        <path d="M17 40.5 L57 23 L47.5 58.5 L38.5 46.5 L28.5 53.5 Z" fill="white" />
        <path d="M38.5 46.5 L33 57 L36.5 44.5 Z" fill="#d6f1fb" />
      </svg>
    )
  }
  if (icon === 'plan') {
    return (
      <svg viewBox="0 0 80 80" className="h-[84px] w-[84px]">
        <rect width="80" height="80" rx="20" className="fill-violet" />
        <path d="M24 22 h22 l12 12 v24 a4 4 0 0 1 -4 4 H24 a4 4 0 0 1 -4 -4 V26 a4 4 0 0 1 4 -4 Z" fill="white" />
        <path d="M46 22 v12 h12" fill="none" stroke="#9333ea" strokeWidth="2" />
        <path d="M28 44 h24 M28 52 h16" stroke="#9333ea" strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 80 80" className="h-[84px] w-[84px]">
      <rect width="80" height="80" rx="20" className="fill-magenta" />
      <path d="M22 40 h28 M40 28 l12 12 -12 12" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="26" cy="40" r="4" fill="white" />
    </svg>
  )
}

/** A packet hops one step of the factory per beat. */
export const Flow: React.FC<{ nodes: readonly Node[]; hops: readonly number[] }> = ({ nodes, hops }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const land = hops.map((beat) => atBeat(beat))
  const width = nodes.length * NODE_W
  const center = (i: number) => (i + 0.5) * NODE_W
  const reveal = progress(frame, 4, 14)

  let x = center(0)
  if (frame < land[0]) {
    x = center(0) - (1 - progress(frame, Math.max(0, land[0] - 14), 14, EASE_IN_OUT)) * 50
  } else {
    let seg = land.length - 1
    for (let i = 0; i < land.length - 1; i++) {
      if (frame < land[i + 1]) {
        seg = i
        break
      }
    }
    if (seg >= land.length - 1 || frame >= land[land.length - 1]) x = center(land.length - 1)
    else {
      const t = progress(frame, land[seg], land[seg + 1] - land[seg], EASE_IN_OUT)
      x = center(seg) + (center(seg + 1) - center(seg)) * t
    }
  }

  return (
    <div className="relative h-[160px]" style={{ width, opacity: reveal }}>
      <div className="absolute top-[42px] right-[46px] left-[46px] h-[2px] bg-white/20" />
      <div
        className="absolute top-[32px] z-10 h-[22px] w-[22px] rounded-full bg-pink"
        style={{ left: x - 11, boxShadow: '0 0 22px 6px #f9a8d4' }}
      />
      {nodes.map((node, i) => {
        const s = pop(frame, fps, land[i] ?? 0, 11)
        const on = frame >= (land[i] ?? 0)
        return (
          <div key={node.label} className="absolute top-0 flex w-[230px] flex-col items-center" style={{ left: i * NODE_W }}>
            <div style={{ transform: `scale(${0.92 + 0.08 * Math.min(1, s)})` }}>
              <Glyph icon={node.icon} />
            </div>
            <div className={`mt-2 font-mono text-[18px] font-bold tracking-wide ${on ? 'text-white' : 'text-white/45'}`}>{node.label}</div>
            <div className="h-[18px] font-mono text-[14px] tracking-wide text-white/50">{node.sub ?? ''}</div>
          </div>
        )
      })}
    </div>
  )
}
